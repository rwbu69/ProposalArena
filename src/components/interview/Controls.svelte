<script lang="ts">
  import { submitAnswer, isProcessing, endInterview, currentProposal, currentMessages } from '../../lib/interview/controller';
  import { voiceEnabled } from '../../lib/state/stores';
  import { Send, Flag, Mic, MicOff, Volume2, VolumeX } from 'lucide-svelte';
  import { SpeechDictation, stopSpeaking } from '../../lib/voice/speech';
  
  let text = '';
  let isRecording = false;
  let dictation: SpeechDictation | null = null;
  
  $: isStaging = $currentMessages.length === 0;
  
  async function handleSubmit() {
    if (!text.trim() || $isProcessing) return;
    const answer = text;
    text = '';
    
    if (isRecording && dictation) {
      dictation.stop();
      isRecording = false;
    }
    
    await submitAnswer(answer);
  }
  
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function toggleVoice() {
    $voiceEnabled = !$voiceEnabled;
    if (!$voiceEnabled) stopSpeaking();
  }

  function toggleDictation() {
    if (isRecording) {
      dictation?.stop();
      isRecording = false;
      return;
    }
    
    const lang = $currentProposal?.language || 'en';
    // Recreate if language might have changed, though it usually doesn't mid-session
    if (!dictation || (dictation as any).lang !== lang) {
      dictation = new SpeechDictation(
        lang, 
        (res) => { 
          // Append or replace? Let's just append for ease
          text = text ? text + ' ' + res : res;
        },
        (err) => { 
          console.warn("Speech error:", err); 
          isRecording = false; 
        },
        () => { 
          isRecording = false; 
        }
      );
    }
    
    if (dictation.isSupported()) {
      isRecording = true;
      dictation.start();
    } else {
      alert("Speech recognition is not supported in this browser. Try Chrome.");
    }
  }
</script>

<div class="p-4 bg-white border-t border-slate-200">
  <div class="flex items-end gap-2">
    <div class="flex flex-col gap-2">
      <button 
        on:click={toggleVoice}
        class="p-2 bg-slate-100 text-slate-600 rounded-lg shadow-sm border border-slate-300 hover:bg-slate-200 flex items-center justify-center flex-shrink-0"
        title={$voiceEnabled ? "Mute Examiner" : "Listen to Examiner"}>
        {#if $voiceEnabled}
          <Volume2 size={18} />
        {:else}
          <VolumeX size={18} />
        {/if}
      </button>
      <button 
        on:click={endInterview}
        disabled={$isProcessing}
        class="p-2 bg-slate-100 text-slate-600 rounded-lg shadow-sm border border-slate-300 hover:bg-slate-200 disabled:opacity-50 flex items-center justify-center flex-shrink-0"
        title="End Defense">
        <Flag size={18} />
      </button>
    </div>

    <div class="relative flex-1">
      <textarea 
        bind:value={text}
        on:keydown={handleKeydown}
        disabled={$isProcessing || isStaging}
        placeholder={$isProcessing ? 'Waiting for AI...' : (isStaging ? 'Please start the defense first...' : (isRecording ? 'Listening...' : 'Type your answer...'))}
        class="w-full resize-none border border-slate-300 rounded-xl p-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
        rows="2"
      ></textarea>
      
      <button 
        on:click={toggleDictation}
        disabled={$isProcessing || isStaging}
        class="absolute right-2 bottom-2 p-2 rounded-lg transition-colors {isRecording ? 'bg-red-100 text-red-600 hover:bg-red-200 animate-pulse' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}"
        title="Dictate Answer">
        {#if isRecording}
          <MicOff size={20} />
        {:else}
          <Mic size={20} />
        {/if}
      </button>
    </div>
    
    <button 
      on:click={handleSubmit}
      disabled={!text.trim() || $isProcessing || isStaging}
      class="p-3 h-full bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 flex items-center justify-center">
      <Send size={20} />
    </button>
  </div>
</div>
