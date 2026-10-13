import { atom } from 'nanostores';
import { currentSession, currentMessages, isProcessing, submitAnswer, currentProposal } from '../interview/controller';
import { uiLanguage, handsFreeEnabled, isPermissionPromptActive } from '../state/stores';
import { speak, stopSpeaking, isSpeaking } from './speech';

// Configurable constants for tuneability
export const SILENCE_TIMEOUT_MS = 3500; // 3.5 seconds of silence after speech to trigger auto-send
export const NO_SPEECH_TIMEOUT_MS = 30000; // 30 seconds of total silence before auto-recording non-response

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
  if (typeof window === 'undefined') return false;
  return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
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
    // Release tracks immediately
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (err) {
    console.warn("Microphone permission denied or unavailable:", err);
    return false;
  } finally {
    // Delay resetting flag by 600ms to ensure window focus has returned
    setTimeout(() => {
      isPermissionPromptActive.set(false);
    }, 600);
  }
}

class HandsFreeEngine {
  private recognition: any = null;
  private silenceTimer: any = null;
  private noSpeechTimer: any = null;
  private countdownInterval: any = null;
  private isSubmitting: boolean = false;
  private isRunning: boolean = false;
  private lastProcessedMessageId: string | null = null;
  private unsubs: Array<() => void> = [];
  private accumulatedFinal: string = '';
  private currentInterim: string = '';

  constructor() {
    if (typeof window !== 'undefined') {
      this.initStoreSubscriptions();
    }
  }

  private initStoreSubscriptions() {
    // React to handsFreeEnabled changes
    const unsubEnabled = handsFreeEnabled.subscribe((enabled) => {
      if (enabled) {
        this.start();
      } else {
        this.stop();
      }
    });
    this.unsubs.push(unsubEnabled);

    // React to AI processing state
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

    // React to incoming messages
    const unsubMessages = currentMessages.subscribe((messages) => {
      if (!this.isRunning) return;
      if (messages.length === 0) return;

      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.role === 'assistant' && lastMsg.id !== this.lastProcessedMessageId) {
        this.lastProcessedMessageId = lastMsg.id;
        this.onNewExaminerQuestion(lastMsg.content);
      }
    });
    this.unsubs.push(unsubMessages);

    // React to session state changes
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
        errorMessage: 'SpeechRecognition API is not supported in this browser.'
      });
      handsFreeEnabled.set(false);
      return;
    }

    this.isRunning = true;
    this.isSubmitting = false;

    // Check if examiner is currently speaking or if we already have an assistant question waiting
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
      // If the question is already present and not spoken yet in hands-free mode
      if (this.lastProcessedMessageId !== lastMsg.id) {
        this.lastProcessedMessageId = lastMsg.id;
        this.onNewExaminerQuestion(lastMsg.content);
      } else {
        // Start listening directly
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
    this.stopRecognition();
    stopSpeaking();
    this.accumulatedFinal = '';
    this.currentInterim = '';
    handsFreeState.set({
      ...handsFreeState.get(),
      status: 'idle',
      interimText: '',
      finalText: '',
      countdownMs: 0
    });
  }

  private clearTimers() {
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

    // 1. Fully stop microphone while TTS is playing so examiner voice is never captured
    this.stopRecognition();
    this.clearTimers();
    this.accumulatedFinal = '';
    this.currentInterim = '';

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

  private startListening() {
    if (!this.isRunning || isProcessing.get()) return;

    this.clearTimers();
    this.accumulatedFinal = '';
    this.currentInterim = '';

    handsFreeState.set({
      ...handsFreeState.get(),
      status: 'listening',
      interimText: '',
      finalText: '',
      countdownMs: 0
    });

    this.setupAndStartRecognition();

    // 30 seconds no-speech timer: if candidate says nothing at all after mic opens
    this.noSpeechTimer = setTimeout(() => {
      this.handleNoSpeechTimeout();
    }, NO_SPEECH_TIMEOUT_MS);
  }

  private setupAndStartRecognition() {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      if (this.recognition) {
        this.recognition.abort();
        this.recognition = null;
      }

      const proposal = currentProposal.get();
      // Set language according to confirmed proposal language (or active uiLanguage as fallback)
      const lang = proposal?.language || uiLanguage.get() || 'id';

      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = lang === 'en' ? 'en-US' : 'id-ID';

      this.recognition.onresult = (event: any) => {
        if (!this.isRunning || this.isSubmitting) return;

        // Clear the 30-second absolute silence timer once candidate begins speaking
        if (this.noSpeechTimer) {
          clearTimeout(this.noSpeechTimer);
          this.noSpeechTimer = null;
        }

        let interim = '';
        let newFinal = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            newFinal += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }

        if (newFinal) {
          this.accumulatedFinal = this.accumulatedFinal
            ? this.accumulatedFinal + ' ' + newFinal.trim()
            : newFinal.trim();
        }
        this.currentInterim = interim.trim();

        // Update live transcript in store
        handsFreeState.set({
          ...handsFreeState.get(),
          finalText: this.accumulatedFinal,
          interimText: this.currentInterim
        });

        // Any speech detected -> (re)start silence countdown
        this.resetSilenceCountdown();
      };

      this.recognition.onerror = (event: any) => {
        // 'no-speech' is a normal browser event during quiet pauses, not a fatal failure
        if (event.error === 'no-speech') {
          return;
        }

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          console.error("Speech recognition permission denied:", event.error);
          handsFreeState.set({
            ...handsFreeState.get(),
            status: 'error',
            errorMessage: 'Microphone permission denied. Switching back to typing.'
          });
          handsFreeEnabled.set(false);
          this.stop();
          return;
        }

        console.warn("Speech recognition warning/error:", event.error);
      };

      this.recognition.onend = () => {
        // Recognition ended by browser (common WebKit/Blink disconnect behavior)
        const currentStatus = handsFreeState.get().status;
        if (
          this.isRunning &&
          !this.isSubmitting &&
          !isSpeaking() &&
          !isProcessing.get() &&
          (currentStatus === 'listening' || currentStatus === 'countdown')
        ) {
          // Restart gracefully without creating duplicate instances
          try {
            this.recognition?.start();
          } catch (e) {
            // If already starting or busy, ignore
          }
        }
      };

      this.recognition.start();
    } catch (e) {
      console.warn("Could not start speech recognition:", e);
    }
  }

  private resetSilenceCountdown() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }

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

  private async handleSilenceTimeout() {
    this.clearTimers();
    const fullAnswer = (this.accumulatedFinal + ' ' + this.currentInterim).trim();
    if (!fullAnswer) {
      // If somehow silence fired without any text, resume listening
      handsFreeState.set({
        ...handsFreeState.get(),
        status: 'listening',
        countdownMs: 0
      });
      return;
    }

    await this.dispatchAnswer(fullAnswer);
  }

  private async handleNoSpeechTimeout() {
    this.clearTimers();
    if (this.isSubmitting || !this.isRunning) return;

    const proposal = currentProposal.get();
    const lang = proposal?.language || uiLanguage.get() || 'id';

    const silenceMarker =
      lang === 'en'
        ? '[Candidate remained silent / No response provided within 30 seconds]'
        : '[Kandidat terdiam / Tidak memberikan jawaban dalam 30 detik]';

    await this.dispatchAnswer(silenceMarker);
  }

  private async dispatchAnswer(answerText: string) {
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    this.clearTimers();
    this.stopRecognition();

    handsFreeState.set({
      ...handsFreeState.get(),
      status: 'submitting',
      interimText: '',
      countdownMs: 0
    });

    try {
      await submitAnswer(answerText);
    } catch (err) {
      console.error("Failed to submit hands-free answer:", err);
    } finally {
      this.isSubmitting = false;
      this.accumulatedFinal = '';
      this.currentInterim = '';
    }
  }

  private stopRecognition() {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (e) {
        // Ignore abort errors
      }
      this.recognition = null;
    }
  }

  public destroy() {
    this.stop();
    this.unsubs.forEach(unsub => unsub());
    this.unsubs = [];
  }
}

export const handsFreeEngine = new HandsFreeEngine();
