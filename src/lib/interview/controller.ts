import { atom } from 'nanostores';
import { v4 as uuidv4 } from 'uuid';
import type { InterviewSession, InterviewMessage, Proposal, ProposalAnalysis, DefenseReport } from '../../types/domain';
import { dbStore } from '../db/database';
import { generateQuestion, evaluateAnswer, generateReport } from '../ai/pipeline';
import { createAIProvider } from '../ai/provider';
import { loadSettings } from '../storage/settings';
import { voiceEnabled } from '../state/stores';
import { speak } from '../voice/speech';

export const currentSession = atom<InterviewSession | null>(null);
export const currentMessages = atom<InterviewMessage[]>([]);
export const currentProposal = atom<Proposal | null>(null);
export const currentAnalysis = atom<ProposalAnalysis | null>(null);
export const currentReport = atom<DefenseReport | null>(null);
export const isProcessing = atom<boolean>(false);

export async function loadProposal(proposalId: string) {
  const proposal = await dbStore.getProposal(proposalId);
  if (proposal) {
    currentProposal.set(proposal);
    const { globalIndexer } = await import('../search/indexer');
    globalIndexer.indexProposal(proposal.id, proposal.text);
  }
}

export async function initSession(proposalId: string) {
  const proposal = await dbStore.getProposal(proposalId);
  if (!proposal) throw new Error("Proposal not found");
  
  currentProposal.set(proposal);
  
  const session: InterviewSession = {
    id: uuidv4(),
    proposalId,
    state: 'READY',
    questionIndex: 0,
    difficulty: 3,
    interruptions: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  await dbStore.saveSession(session);
  currentSession.set(session);
  currentMessages.set([]);
}

function getProvider() {
  const settings = loadSettings();
  if (!settings || !settings.apiKey) throw new Error("API Key is missing. Please configure settings.");
  return createAIProvider({
    providerId: settings.providerId || 'openrouter',
    apiKey: settings.apiKey,
    model: settings.model || 'meta-llama/llama-3.1-8b-instruct:free'
  });
}

export async function askNextQuestion() {
  const session = currentSession.get();
  const analysis = currentAnalysis.get();
  const proposal = currentProposal.get();
  if (!session || !analysis || !proposal) return;
  
  isProcessing.set(true);
  try {
    const provider = getProvider();
    const messages = await dbStore.getMessages(session.id);
    const question = await generateQuestion(provider, analysis, messages, proposal.language, session.difficulty);
    
    await addMessage('assistant', question);
    
    if (voiceEnabled.get()) {
      speak(question, proposal.language);
    }
    
    session.state = 'WAITING_FOR_ANSWER';
    session.questionIndex++;
    await dbStore.saveSession(session);
    currentSession.set(session);
  } finally {
    isProcessing.set(false);
  }
}

export async function submitAnswer(answer: string) {
  const session = currentSession.get();
  const proposal = currentProposal.get();
  if (!session || !proposal) return;
  
  isProcessing.set(true);
  try {
    await addMessage('user', answer);
    session.state = 'EVALUATING';
    await dbStore.saveSession(session);
    currentSession.set(session);
    
    const messages = await dbStore.getMessages(session.id);
    const lastQuestion = [...messages].reverse().find(m => m.role === 'assistant');
    
    if (lastQuestion) {
      const provider = getProvider();
      const evalResult = await evaluateAnswer(provider, lastQuestion.content, answer, proposal.language);
      
      // In a full version, we'd save the evalResult to dbStore.saveEvaluation()
      console.log("Evaluation Result:", evalResult);
    }
    
    // Automatically transition to the next question for MVP
    await askNextQuestion();
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
  
  isProcessing.set(true);
  try {
    session.state = 'REPORT_GENERATION';
    await dbStore.saveSession(session);
    currentSession.set(session);
    
    const messages = await dbStore.getMessages(session.id);
    const provider = getProvider();
    
    const report = await generateReport(provider, messages, proposal.language);
    report.id = session.id;
    await dbStore.saveReport(report);
    
    session.state = 'REPORT_READY';
    await dbStore.saveSession(session);
    currentSession.set(session);
    currentReport.set(report);
    
    // Redirect to standalone report page
    window.location.href = `/report?id=${session.id}`;
  } catch (e) {
    console.error("Failed to generate report", e);
  } finally {
    isProcessing.set(false);
  }
}
