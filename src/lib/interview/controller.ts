import { atom } from 'nanostores';
import { v4 as uuidv4 } from 'uuid';
import type { InterviewSession, InterviewMessage, Proposal, ProposalAnalysis, DefenseReport } from '../../types/domain';
import { dbStore } from '../db/database';
import { generateQuestion, evaluateAnswer, generateReport } from '../ai/pipeline';
import { createAIProvider } from '../ai/provider';
import { DEFAULT_SERVER_PROXY_MODEL, loadSettings } from '../storage/settings';
import { voiceEnabled, handsFreeEnabled } from '../state/stores';
import { speak, stopSpeaking, prefetchSpeech } from '../voice/speech';
import { transitionSession } from './engine';

export const currentSession = atom<InterviewSession | null>(null);
export const currentMessages = atom<InterviewMessage[]>([]);
export const currentProposal = atom<Proposal | null>(null);
export const currentAnalysis = atom<ProposalAnalysis | null>(null);
export const currentReport = atom<DefenseReport | null>(null);
export const isProcessing = atom<boolean>(false);
export const processingStage = atom<'question' | 'voice' | null>(null);
export const MAX_QUESTIONS = 10;
export const selectedTimeLimit = atom<number>(0); // 0 = no timer, 15, 20, 30 minutes
export const endingStatusMessage = atom<string | null>(null);
export const sessionError = atom<string | null>(null);

export function setTimeLimit(minutes: number) {
  selectedTimeLimit.set(minutes);
  const session = currentSession.get();
  if (session && session.questionIndex === 0) {
    session.timeLimitMinutes = minutes > 0 ? minutes : undefined;
    dbStore.saveSession(session);
    currentSession.set(session);
  }
}

export function formatFriendlyErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err || '');
  if (!raw) return 'Terjadi kendala pada sistem. Silakan coba lagi.';

  const lower = raw.toLowerCase();
  if (lower.includes('dynamically imported module') || lower.includes('failed to fetch dynamically')) {
    return 'Modul sistem peramban sempat memuat ulang di dev mode. Silakan klik tombol "Mulai Sidang" sekali lagi.';
  }
  if (lower.includes('gemini_api_key') || lower.includes('api key belum')) {
    return 'Gemini API Key belum terkonfigurasi. Silakan buka Pengaturan (ikon gerigi) untuk memasukkan API Key.';
  }
  if (lower.includes('503') || lower.includes('overloaded') || lower.includes('429')) {
    return 'Layanan Google Gemini sedang menerima banyak request. Silakan klik Mulai Sidang lagi dalam beberapa detik.';
  }
  if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('unable to reach')) {
    return 'Koneksi ke server AI terputus. Pastikan koneksi internet stabil dan coba kembali.';
  }
  return raw;
}

export async function restoreActiveSession() {
    const sessions = await dbStore.getActiveSessions();
    const session = sessions.sort((a, b) => b.updatedAt - a.updatedAt)[0];
    if (!session) return false;

    const proposal = await dbStore.getProposal(session.proposalId);
    const analysis = await dbStore.getAnalysis(session.proposalId);
    if (!proposal || !analysis) return false;

    currentSession.set(session);
    currentProposal.set(proposal);
    currentAnalysis.set(analysis);
    currentMessages.set(await dbStore.getMessages(session.id));
    try {
      const { globalIndexer } = await import('../search/indexer');
      globalIndexer.indexProposal(proposal.id, proposal.text);
    } catch (e) {
      console.warn("Failed to index proposal on restore:", e);
    }
    return true;
}

export async function exitActiveSession() {
  stopSpeaking();
  handsFreeEnabled.set(false);
  const session = currentSession.get();
  if (session) {
    session.state = 'COMPLETED';
    session.updatedAt = Date.now();
    await dbStore.saveSession(session);
  }
  currentSession.set(null);
  currentMessages.set([]);
  currentProposal.set(null);
  currentAnalysis.set(null);
  endingStatusMessage.set(null);
  sessionError.set(null);
}

export async function initSession(proposalId: string, timeLimitMinutes?: number) {
  const proposal = await dbStore.getProposal(proposalId);
  if (!proposal) throw new Error("Proposal not found");
  
  currentProposal.set(proposal);
  
  const analysis = await dbStore.getAnalysis(proposalId);
  if (analysis) {
    currentAnalysis.set(analysis);
  }
  
  const limit = timeLimitMinutes !== undefined ? timeLimitMinutes : selectedTimeLimit.get();
  const session: InterviewSession = {
    id: uuidv4(),
    proposalId,
    state: 'READY',
    questionIndex: 0,
    difficulty: 3,
    interruptions: 0,
    timeLimitMinutes: limit > 0 ? limit : undefined,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  await dbStore.saveSession(session);
  currentSession.set(session);
  currentMessages.set([]);
  endingStatusMessage.set(null);
  sessionError.set(null);
}

function getProvider() {
  const settings = loadSettings();
  const proxyUrl = import.meta.env.PUBLIC_AI_PROXY_URL || settings?.proxyUrl;
  const usesServerProxy = proxyUrl?.startsWith('/');
  if (!usesServerProxy && !settings?.apiKey) {
    throw new Error("API Key belum dikonfigurasi. Harap isi di Pengaturan (ikon gerigi).");
  }
  return createAIProvider({
    providerId: 'gemini',
    apiKey: settings?.apiKey,
    model: usesServerProxy ? DEFAULT_SERVER_PROXY_MODEL : (settings?.model || 'gemini-3.5-flash-lite'),
    proxyUrl: proxyUrl || 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
  });
}

export async function askNextQuestion() {
  const session = currentSession.get();
  if (!session) return;

  let analysis: ProposalAnalysis | undefined | null = currentAnalysis.get();
  let proposal: Proposal | undefined | null = currentProposal.get();

  if (!proposal) {
    proposal = await dbStore.getProposal(session.proposalId);
    if (proposal) currentProposal.set(proposal);
  }
  if (!analysis) {
    analysis = await dbStore.getAnalysis(session.proposalId);
    if (analysis) currentAnalysis.set(analysis);
  }

  if (!proposal || !analysis) {
    sessionError.set("Berkas proposal atau analisis tidak ditemukan di penyimpanan browser. Coba unggah ulang berkas proposal.");
    return;
  }
  
  sessionError.set(null);
  isProcessing.set(true);
  processingStage.set('question');

  try {
    // Record wall-clock start time on the very first question
    if (!session.startedAt) {
      session.startedAt = Date.now();
      await dbStore.saveSession(session);
      currentSession.set(session);
    }

    const provider = getProvider();
    const messages = await dbStore.getMessages(session.id);
    let question = await generateQuestion(provider, analysis, messages, proposal.language, session.difficulty);
    const normalizedQuestion = question.toLowerCase().replace(/\W+/g, ' ').trim();
    const duplicate = messages.some(message =>
      message.role === 'assistant' &&
      message.content.toLowerCase().replace(/\W+/g, ' ').trim() === normalizedQuestion
    );
    if (duplicate) {
      question = proposal.language === 'id'
        ? 'Mari kita perdalam aspek metodologi yang belum Anda jelaskan dalam proposal.'
        : 'Let us examine a methodological aspect that you have not yet explained in the proposal.';
    }

    if (voiceEnabled.get() || handsFreeEnabled.get()) {
      processingStage.set('voice');
      await prefetchSpeech(question, proposal.language);
    }
    
    await addMessage('assistant', question);
    
    if (voiceEnabled.get() && !handsFreeEnabled.get()) {
      speak(question, proposal.language);
    }
    
    const questioningSession = transitionSession(session, 'QUESTIONING');
    const readySession = transitionSession(questioningSession, 'WAITING_FOR_ANSWER');
    Object.assign(session, readySession);
    session.questionIndex++;
    await dbStore.saveSession(session);
    currentSession.set(session);
  } catch (err: any) {
    console.error("Error asking question:", err);
    sessionError.set(formatFriendlyErrorMessage(err));
  } finally {
    processingStage.set(null);
    isProcessing.set(false);
  }
}

export async function submitAnswer(answer: string) {
  const session = currentSession.get();
  const proposal = currentProposal.get();
  if (!session || !proposal) return;
  
  sessionError.set(null);
  isProcessing.set(true);
  try {
    await addMessage('user', answer);
    Object.assign(session, transitionSession(session, 'EVALUATING'));
    await dbStore.saveSession(session);
    currentSession.set(session);
    
    const messages = await dbStore.getMessages(session.id);
    const lastQuestion = [...messages].reverse().find(m => m.role === 'assistant');
    
    if (lastQuestion) {
      try {
        const provider = getProvider();
        const evalResult = await evaluateAnswer(provider, lastQuestion.content, answer, proposal.language);
        
        if (
          typeof evalResult.correctness === 'number' &&
          typeof evalResult.relevance === 'number' &&
          typeof evalResult.depth === 'number' &&
          typeof evalResult.justification === 'number' &&
          typeof evalResult.clarity === 'number' &&
          typeof evalResult.feedback === 'string'
        ) {
          await dbStore.saveEvaluation({
            id: `${session.id}_${lastQuestion.id}`,
            sessionId: session.id,
            messageId: lastQuestion.id,
            correctness: evalResult.correctness,
            relevance: evalResult.relevance,
            depth: evalResult.depth,
            justification: evalResult.justification,
            clarity: evalResult.clarity,
            feedback: evalResult.feedback,
            evaluatedAt: Date.now()
          });
          const evaluationAverage = (
            evalResult.correctness +
            evalResult.relevance +
            evalResult.depth +
            evalResult.justification +
            evalResult.clarity
          ) / 5;
          session.difficulty = Math.max(
            1,
            Math.min(5, session.difficulty + (evaluationAverage >= 4 ? 1 : evaluationAverage <= 2 ? -1 : 0))
          );
          await dbStore.saveSession(session);
          currentSession.set(session);
        }
      } catch (evalErr) {
        console.warn("Evaluation step failed, continuing to next question:", evalErr);
      }
    }
    
    // Check whether timer has expired or question limit has been reached
    let isTimeExpired = false;
    if (session.timeLimitMinutes && session.startedAt) {
      const elapsedMinutes = (Date.now() - session.startedAt) / 60000;
      if (elapsedMinutes >= session.timeLimitMinutes) {
        isTimeExpired = true;
      }
    }

    const isLimitReached = session.questionIndex >= MAX_QUESTIONS;

    if (isLimitReached || isTimeExpired) {
      const isId = proposal.language === 'id';
      let endMsg = '';
      if (isTimeExpired) {
        endMsg = isId
          ? 'Waktu habis, sesi diakhiri setelah jawabanmu. Catatan sedang disusun...'
          : 'Time is up. The session has ended after your answer. Notes are being prepared...';
      } else {
        endMsg = isId
          ? 'Sesi selesai, catatan sedang disusun...'
          : 'Session complete. Notes are being prepared...';
      }

      endingStatusMessage.set(endMsg);

      if (voiceEnabled.get()) {
        speak(endMsg, proposal.language);
      }

      await endInterview();
      return;
    }

    // Automatically transition to the next question for MVP
    await askNextQuestion();
  } catch (err: any) {
    console.error("Error submitting answer:", err);
    sessionError.set(formatFriendlyErrorMessage(err));
  } finally {
    isProcessing.set(false);
  }
}

async function addMessage(role: 'system' | 'user' | 'assistant', content: string) {
  const session = currentSession.get();
  if (!session) return;
  
  const msg: InterviewMessage = {
    id: uuidv4(),
    sessionId: session.id,
    role,
    content,
    timestamp: Date.now()
  };
  
  await dbStore.saveMessage(msg);
  currentMessages.set([...currentMessages.get(), msg]);
}

export async function endInterview() {
  const session = currentSession.get();
  const proposal = currentProposal.get();
  if (!session || !proposal) return;
  
  sessionError.set(null);
  isProcessing.set(true);
  try {
    if (session.state === 'READY') {
      Object.assign(session, transitionSession(session, 'QUESTIONING'));
      Object.assign(session, transitionSession(session, 'WAITING_FOR_ANSWER'));
    }
    if (session.state === 'WAITING_FOR_ANSWER') {
      Object.assign(session, transitionSession(session, 'EVALUATING'));
      Object.assign(session, transitionSession(session, 'COMPLETED'));
    } else if (session.state === 'EVALUATING') {
      Object.assign(session, transitionSession(session, 'COMPLETED'));
    }
    if (session.state === 'COMPLETED') {
      Object.assign(session, transitionSession(session, 'REPORT_GENERATION'));
    } else if (session.state !== 'REPORT_GENERATION') {
      session.state = 'REPORT_GENERATION';
    }
    await dbStore.saveSession(session);
    currentSession.set(session);
    
    const messages = await dbStore.getMessages(session.id);
    const provider = getProvider();
    
    const report = await generateReport(provider, messages, proposal.language);
    report.id = session.id;
    await dbStore.saveReport(report);
    
    Object.assign(session, transitionSession(session, 'REPORT_READY'));
    await dbStore.saveSession(session);
    currentSession.set(session);
    currentReport.set(report);
    
    // Redirect to standalone report page
    window.location.href = `/report?id=${session.id}`;
  } catch (e: any) {
    console.error("Failed to generate report", e);
    session.state = 'COMPLETED';
    await dbStore.saveSession(session);
    currentSession.set(session);
    endingStatusMessage.set(null);
    sessionError.set(formatFriendlyErrorMessage(e));
  } finally {
    isProcessing.set(false);
  }
}
