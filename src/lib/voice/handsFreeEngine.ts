import { atom } from 'nanostores';
import { currentSession, currentMessages, isProcessing, submitAnswer, currentProposal } from '../interview/controller';
import { uiLanguage, handsFreeEnabled, isPermissionPromptActive } from '../state/stores';
import { speak, stopSpeaking, isSpeaking } from './speech';
import { transcribeAudio } from './recorder';

export const SILENCE_TIMEOUT_MS = 3500; // 3.5 seconds of silence after speech to trigger auto-send
export const NO_SPEECH_TIMEOUT_MS = 30000; // 30 seconds of total silence before auto-recording non-response
const SPEECH_RMS_THRESHOLD = 0.015; // RMS amplitude threshold to detect active speech

export type HandsFreeStatus =
  | 'idle'
  | 'examiner_speaking'
  | 'listening'
  | 'countdown'
  | 'submitting'
  | 'examiner_thinking'
  | 'unsupported'
  | 'error';

export interface HandsFreeState {
  status: HandsFreeStatus;
  interimText: string;
  finalText: string;
  countdownMs: number;
  errorMessage?: string;
  supported: boolean;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return Boolean(
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function' &&
    typeof MediaRecorder !== 'undefined'
  );
}

export const handsFreeState = atom<HandsFreeState>({
  status: 'idle',
  interimText: '',
  finalText: '',
  countdownMs: 0,
  supported: isSpeechRecognitionSupported()
});

export async function requestMicrophonePermission(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return false;
  }
  isPermissionPromptActive.set(true);
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (err) {
    console.warn("Microphone permission denied or unavailable:", err);
    return false;
  } finally {
    setTimeout(() => {
      isPermissionPromptActive.set(false);
    }, 600);
  }
}

class HandsFreeEngine {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private vadInterval: ReturnType<typeof setInterval> | null = null;
  private silenceTimer: ReturnType<typeof setTimeout> | null = null;
  private noSpeechTimer: ReturnType<typeof setTimeout> | null = null;
  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private hasSpoken = false;
  private isSubmitting = false;
  private isRunning = false;
  private lastProcessedMessageId: string | null = null;
  private unsubs: Array<() => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.initStoreSubscriptions();
    }
  }

  private initStoreSubscriptions() {
    const unsubEnabled = handsFreeEnabled.subscribe((enabled) => {
      if (enabled) {
        this.start();
      } else {
        this.stop();
      }
    });
    this.unsubs.push(unsubEnabled);

    const unsubProcessing = isProcessing.subscribe((processing) => {
      if (!this.isRunning) return;
      if (processing) {
        handsFreeState.set({
          ...handsFreeState.get(),
          status: 'examiner_thinking',
          interimText: '',
          finalText: '',
          countdownMs: 0
        });
      }
    });
    this.unsubs.push(unsubProcessing);

    const unsubMessages = currentMessages.subscribe((messages) => {
      if (!this.isRunning || messages.length === 0) return;
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.role === 'assistant' && lastMsg.id !== this.lastProcessedMessageId) {
        this.lastProcessedMessageId = lastMsg.id;
        this.onNewExaminerQuestion(lastMsg.content);
      }
    });
    this.unsubs.push(unsubMessages);

    const unsubSession = currentSession.subscribe((session) => {
      if (!session || session.state === 'COMPLETED' || session.state === 'REPORT_GENERATION' || session.state === 'REPORT_READY') {
        if (this.isRunning) {
          this.stop();
        }
      }
    });
    this.unsubs.push(unsubSession);
  }

  public start() {
    if (!isSpeechRecognitionSupported()) {
      handsFreeState.set({
        ...handsFreeState.get(),
        status: 'unsupported',
        supported: false,
        errorMessage: 'MediaRecorder API is not supported in this browser.'
      });
      handsFreeEnabled.set(false);
      return;
    }

    this.isRunning = true;
    this.isSubmitting = false;

    const messages = currentMessages.get();
    const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;

    if (isSpeaking()) {
      handsFreeState.set({
        ...handsFreeState.get(),
        status: 'examiner_speaking',
        supported: true
      });
      return;
    }

    if (lastMsg && lastMsg.role === 'assistant' && !isProcessing.get()) {
      if (this.lastProcessedMessageId !== lastMsg.id) {
        this.lastProcessedMessageId = lastMsg.id;
        this.onNewExaminerQuestion(lastMsg.content);
      } else {
        this.startListening();
      }
    } else if (isProcessing.get()) {
      handsFreeState.set({
        ...handsFreeState.get(),
        status: 'examiner_thinking',
        supported: true
      });
    } else {
      handsFreeState.set({
        ...handsFreeState.get(),
        status: 'idle',
        supported: true
      });
    }
  }

  public stop() {
    this.isRunning = false;
    this.clearTimers();
    this.stopAudioCapture();
    stopSpeaking();
    this.hasSpoken = false;
    handsFreeState.set({
      ...handsFreeState.get(),
      status: 'idle',
      interimText: '',
      finalText: '',
      countdownMs: 0
    });
  }

  private clearTimers() {
    if (this.vadInterval) {
      clearInterval(this.vadInterval);
      this.vadInterval = null;
    }
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.noSpeechTimer) {
      clearTimeout(this.noSpeechTimer);
      this.noSpeechTimer = null;
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  private onNewExaminerQuestion(questionText: string) {
    if (!this.isRunning) return;

    this.stopAudioCapture();
    this.clearTimers();
    this.hasSpoken = false;

    handsFreeState.set({
      ...handsFreeState.get(),
      status: 'examiner_speaking',
      interimText: '',
      finalText: '',
      countdownMs: 0
    });

    const proposal = currentProposal.get();
    const lang = proposal?.language || uiLanguage.get() || 'id';

    speak(questionText, lang, {
      onEnd: () => {
        if (!this.isRunning) return;
        this.startListening();
      },
      onError: (err) => {
        console.warn("TTS playback error in hands-free mode:", err);
        if (!this.isRunning) return;
        this.startListening();
      }
    });
  }

  private async startListening() {
    if (!this.isRunning || isProcessing.get()) return;

    this.clearTimers();
    this.stopAudioCapture();
    this.hasSpoken = false;

    handsFreeState.set({
      ...handsFreeState.get(),
      status: 'listening',
      interimText: '',
      finalText: '',
      countdownMs: 0
    });

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }

      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });
      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      this.mediaRecorder.start(250);

      // Voice Activity Detection via AudioContext AnalyserNode
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
        const source = this.audioContext.createMediaStreamSource(this.stream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 1024;
        source.connect(this.analyser);

        const dataArray = new Float32Array(this.analyser.fftSize);
        this.vadInterval = setInterval(() => {
          if (!this.isRunning || this.isSubmitting || !this.analyser) return;
          this.analyser.getFloatTimeDomainData(dataArray);
          let sumSq = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const sample = dataArray[i] ?? 0;
            sumSq += sample * sample;
          }
          const rms = Math.sqrt(sumSq / dataArray.length);

          if (rms > SPEECH_RMS_THRESHOLD) {
            if (!this.hasSpoken) {
              this.hasSpoken = true;
              if (this.noSpeechTimer) {
                clearTimeout(this.noSpeechTimer);
                this.noSpeechTimer = null;
              }
            }
            // Active speech detected -> cancel silence countdown if running
            if (this.silenceTimer) {
              clearTimeout(this.silenceTimer);
              this.silenceTimer = null;
            }
            if (this.countdownInterval) {
              clearInterval(this.countdownInterval);
              this.countdownInterval = null;
            }
            if (handsFreeState.get().status !== 'listening') {
              handsFreeState.set({
                ...handsFreeState.get(),
                status: 'listening',
                countdownMs: 0
              });
            }
          } else if (this.hasSpoken && !this.silenceTimer) {
            // Candidate stopped speaking -> start 3.5s silence countdown
            this.startSilenceCountdown();
          }
        }, 120);
      }

      this.noSpeechTimer = setTimeout(() => {
        this.handleNoSpeechTimeout();
      }, NO_SPEECH_TIMEOUT_MS);
    } catch (err) {
      console.error("Microphone capture failed in hands-free mode:", err);
      handsFreeState.set({
        ...handsFreeState.get(),
        status: 'error',
        errorMessage: 'Microphone permission denied. Switching back to typing.'
      });
      handsFreeEnabled.set(false);
      this.stop();
    }
  }

  private startSilenceCountdown() {
    let remainingMs = SILENCE_TIMEOUT_MS;
    handsFreeState.set({
      ...handsFreeState.get(),
      status: 'countdown',
      countdownMs: remainingMs
    });

    const tickIntervalMs = 100;
    this.countdownInterval = setInterval(() => {
      remainingMs -= tickIntervalMs;
      if (remainingMs < 0) remainingMs = 0;
      handsFreeState.set({
        ...handsFreeState.get(),
        countdownMs: remainingMs
      });
    }, tickIntervalMs);

    this.silenceTimer = setTimeout(() => {
      this.handleSilenceTimeout();
    }, SILENCE_TIMEOUT_MS);
  }

  private stopAndCollectAudio(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        this.stopAudioCapture();
        resolve(null);
        return;
      }

      const recorder = this.mediaRecorder;
      const mimeType = recorder.mimeType || 'audio/webm';
      recorder.onstop = () => {
        const blob = this.audioChunks.length > 0 ? new Blob(this.audioChunks, { type: mimeType }) : null;
        this.stopAudioCapture();
        resolve(blob);
      };

      try {
        recorder.stop();
      } catch {
        this.stopAudioCapture();
        resolve(null);
      }
    });
  }

  private async handleSilenceTimeout() {
    if (this.isSubmitting || !this.isRunning) return;
    this.isSubmitting = true;
    this.clearTimers();

    handsFreeState.set({
      ...handsFreeState.get(),
      status: 'submitting',
      interimText: '',
      countdownMs: 0
    });

    try {
      const audioBlob = await this.stopAndCollectAudio();
      if (!audioBlob || audioBlob.size === 0) {
        this.isSubmitting = false;
        this.startListening();
        return;
      }

      const proposal = currentProposal.get();
      const lang = proposal?.language || uiLanguage.get() || 'id';
      const transcript = await transcribeAudio(audioBlob, lang);

      if (!transcript || !transcript.trim()) {
        this.isSubmitting = false;
        this.startListening();
        return;
      }

      handsFreeState.set({
        ...handsFreeState.get(),
        finalText: transcript
      });

      await submitAnswer(transcript);
    } catch (err) {
      console.error("Hands-free Groq Whisper transcription/submit failed:", err);
      if (this.isRunning) {
        this.isSubmitting = false;
        this.startListening();
        return;
      }
    } finally {
      this.isSubmitting = false;
      this.hasSpoken = false;
    }
  }

  private async handleNoSpeechTimeout() {
    if (this.isSubmitting || !this.isRunning) return;
    this.isSubmitting = true;
    this.clearTimers();
    this.stopAudioCapture();

    handsFreeState.set({
      ...handsFreeState.get(),
      status: 'submitting',
      interimText: '',
      countdownMs: 0
    });

    const proposal = currentProposal.get();
    const lang = proposal?.language || uiLanguage.get() || 'id';
    const silenceMarker =
      lang === 'en'
        ? '[Candidate remained silent / No response provided within 30 seconds]'
        : '[Kandidat terdiam / Tidak memberikan jawaban dalam 30 detik]';

    try {
      await submitAnswer(silenceMarker);
    } catch (err) {
      console.error("Failed to submit no-speech marker:", err);
    } finally {
      this.isSubmitting = false;
      this.hasSpoken = false;
    }
  }

  private stopAudioCapture() {
    if (this.mediaRecorder) {
      if (this.mediaRecorder.state !== 'inactive') {
        try {
          this.mediaRecorder.stop();
        } catch {}
      }
      this.mediaRecorder = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
      this.analyser = null;
    }
    this.audioChunks = [];
  }

  public destroy() {
    this.stop();
    this.unsubs.forEach(unsub => unsub());
    this.unsubs = [];
  }
}

export const handsFreeEngine = new HandsFreeEngine();
