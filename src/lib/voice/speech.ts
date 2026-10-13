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

export function speak(text: string, lang: 'en' | 'id' = 'id') {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang === 'en' ? 'en-US' : 'id-ID';
  utterance.rate = 1.0;

  const matchedVoice = findBestVoice(lang);
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }
  
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
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
