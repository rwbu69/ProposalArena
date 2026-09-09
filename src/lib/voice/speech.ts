export function speak(text: string, lang: 'en' | 'id') {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  // Using generic locales
  utterance.lang = lang === 'en' ? 'en-US' : 'id-ID';
  utterance.rate = 1.0;
  
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}

// Wrapper for SpeechRecognition
export class SpeechDictation {
  private recognition: any = null;

  constructor(private lang: 'en' | 'id', private onResult: (text: string) => void, private onError: (err: string) => void, private onEnd: () => void) {
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
