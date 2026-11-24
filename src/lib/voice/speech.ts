// Voice management and caching for Web Speech API
let cachedVoices: SpeechSynthesisVoice[] = [];

function loadVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  if (cachedVoices.length > 0) return cachedVoices;
  cachedVoices = window.speechSynthesis.getVoices();
  return cachedVoices;
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
}

function findBestVoice(lang: 'en' | 'id'): SpeechSynthesisVoice | null {
  const voices = loadVoices();
  if (voices.length === 0) return null;

  if (lang === 'id') {
    // Prioritize natural Indonesian voices across platforms (Edge Natural, Chrome Google, Apple Damayanti)
    const idVoice =
      voices.find(v => (v.lang === 'id-ID' || v.lang === 'id_ID') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Gadis') || v.name.includes('Ardi') || v.name.includes('Damayanti'))) ||
      voices.find(v => v.lang === 'id-ID' || v.lang === 'id_ID') ||
      voices.find(v => v.lang.toLowerCase().startsWith('id'));
    return idVoice || null;
  } else {
    // Prioritize natural English voices
    const enVoice =
      voices.find(v => (v.lang === 'en-US' || v.lang === 'en-GB') && (v.name.includes('Natural') || v.name.includes('Google'))) ||
      voices.find(v => v.lang.toLowerCase().startsWith('en'));
    return enVoice || null;
  }
}

let currentAudio: HTMLAudioElement | null = null;
let preparedAudioCache: { text: string; lang: 'en' | 'id'; dataUrl: string } | null = null;

export interface SpeakOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

export function isSpeaking(): boolean {
  if (currentAudio && !currentAudio.paused && !currentAudio.ended) return true;
  if (typeof window !== 'undefined' && window.speechSynthesis) return window.speechSynthesis.speaking;
  return false;
}

export function stopSpeaking(): void {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch {
      // ignore
    }
    currentAudio = null;
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

function speakFallbackWebSpeech(
  text: string,
  lang: 'en' | 'id' = 'id',
  options?: SpeakOptions
): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      options?.onEnd?.();
      resolve();
      return;
    }

    window.speechSynthesis.cancel();

    if (!text || !text.trim()) {
      options?.onEnd?.();
      resolve();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'en' ? 'en-US' : 'id-ID';
    utterance.rate = 1.0;

    const matchedVoice = findBestVoice(lang);
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      options?.onEnd?.();
      resolve();
    };

    utterance.onstart = () => {
      options?.onStart?.();
    };

    utterance.onend = () => {
      finish();
    };

    utterance.onerror = (e) => {
      options?.onError?.(e);
      finish();
    };

    window.speechSynthesis.speak(utterance);
  });
}

async function fetchTTSDataUrl(text: string, lang: 'en' | 'id', timeoutMs = 15000): Promise<string | null> {
  if (!text || !text.trim()) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        language: lang,
        voice: 'Fenrir'
      }),
      signal: controller.signal
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { audio?: string; mimeType?: string };
    if (!data?.audio) return null;
    return `data:${data.mimeType || 'audio/wav'};base64,${data.audio}`;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function prefetchSpeech(
  text: string,
  lang: 'en' | 'id' = 'id',
  timeoutMs = 15000
): Promise<void> {
  if (!text || !text.trim()) return;
  const dataUrl = await fetchTTSDataUrl(text, lang, timeoutMs);
  if (dataUrl) {
    preparedAudioCache = { text, lang, dataUrl };
  }
}

export async function speak(
  text: string,
  lang: 'en' | 'id' = 'id',
  options?: SpeakOptions
): Promise<void> {
  stopSpeaking();

  if (!text || !text.trim()) {
    options?.onEnd?.();
    return;
  }

  // 1. Primary: Use pre-fetched cache if available, otherwise call /api/tts
  try {
    let dataUrl: string | null = null;
    if (preparedAudioCache && preparedAudioCache.text === text && preparedAudioCache.lang === lang) {
      dataUrl = preparedAudioCache.dataUrl;
      preparedAudioCache = null;
    } else {
      dataUrl = await fetchTTSDataUrl(text, lang, 25000);
    }

    if (dataUrl) {
      return new Promise((resolve) => {
        const audio = new Audio(dataUrl);
        currentAudio = audio;

        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          currentAudio = null;
          options?.onEnd?.();
          resolve();
        };

        audio.onplay = () => options?.onStart?.();
        audio.onended = finish;
        audio.onerror = (e) => {
          console.warn("Gemini audio playback error, falling back to Web Speech:", e);
          finish();
          speakFallbackWebSpeech(text, lang, options).then(resolve);
        };

        audio.play().catch((playErr) => {
          console.warn("Autoplay blocked or playback failed, fallback to Web Speech:", playErr);
          speakFallbackWebSpeech(text, lang, options).then(resolve);
        });
      });
    }
  } catch (err) {
    console.warn("Gemini TTS API unavailable, falling back to Web Speech:", err);
  }

  // 2. Fallback to Web Speech API
  return speakFallbackWebSpeech(text, lang, options);
}


// Wrapper for SpeechRecognition with Indonesian as primary default
export class SpeechDictation {
  private recognition: any = null;
  public readonly language: 'en' | 'id';

  constructor(
    lang: 'en' | 'id' = 'id',
    private onResult: (text: string) => void,
    private onError: (err: string) => void,
    private onEnd: () => void
  ) {
    this.language = lang;
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = lang === 'en' ? 'en-US' : 'id-ID';
        
        this.recognition.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            this.onResult(finalTranscript);
          }
        };
        
        this.recognition.onerror = (event: any) => {
          this.onError(event.error);
        };

        this.recognition.onend = () => {
          this.onEnd();
        };
      }
    }
  }

  isSupported() {
    return this.recognition !== null;
  }

  start() {
    if (this.recognition) {
      try {
        this.recognition.start();
      } catch (e) {
        console.warn("Speech recognition already started");
      }
    }
  }

  stop() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }
}
