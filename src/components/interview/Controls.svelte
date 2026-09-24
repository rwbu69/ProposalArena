<script lang="ts">
  import { submitAnswer, isProcessing, endInterview, currentProposal, currentMessages } from '../../lib/interview/controller';
  import { voiceEnabled } from '../../lib/state/stores';
  import { Send, Flag, Mic, MicOff, Volume2, VolumeX } from 'lucide-svelte';
  import { SpeechDictation, stopSpeaking } from '../../lib/voice/speech';
  import { t } from 'svelte-i18n';
  
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

  function autoResize(e: Event) {
    const el = e.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
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
    if (!dictation || (dictation as any).lang !== lang) {
      dictation = new SpeechDictation(
        lang, 
        (res) => { 
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
      alert($t('interview.dictationUnsupported'));
    }
  }
</script>

<div class="px-6 lg:px-8 pb-8 z-10 shrink-0">
  <div class="flex flex-col gap-4">
    {#if !isStaging}
      <div class="relative w-full group">
        <textarea 
          bind:value={text}
          on:keydown={handleKeydown}
          on:input={autoResize}
          disabled={$isProcessing}
          rows="1" 
          placeholder={$isProcessing ? $t('interview.waiting') : (isRecording ? $t('interview.listening') : $t('interview.placeholder'))}
          class="w-full bg-transparent border-b border-zinc-300 dark:border-space-borderSoft focus:border-black dark:focus:border-space-textHighlight text-black dark:text-space-textHighlight text-base md:text-lg resize-none outline-none py-3 pr-24 transition-colors duration-300 placeholder:text-zinc-400 dark:placeholder:text-space-textMuted disabled:opacity-50"
        ></textarea>
        
        <div class="absolute right-0 bottom-3 flex gap-2">
          <!-- Voice Dictation -->
          <button 
            on:click={toggleDictation}
            disabled={$isProcessing}
            class="p-2 transition-colors {isRecording ? 'text-red-500 animate-pulse' : 'text-zinc-400 dark:text-space-textSoft hover:text-black dark:hover:text-space-textHighlight'}" 
            title={$t('interview.dictate')}>
            {#if isRecording}
              <MicOff size={20} strokeWidth={1.5} />
            {:else}
              <Mic size={20} strokeWidth={1.5} />
            {/if}
          </button>
          <!-- Send -->
          <button 
            on:click={handleSubmit}
            disabled={!text.trim() || $isProcessing}
            class="p-2 text-zinc-400 dark:text-space-textSoft hover:text-black dark:hover:text-space-textHighlight disabled:opacity-50 transition-colors" 
            title={$t('interview.send')}>
            <Send size={20} strokeWidth={1.5} />
          </button>
        </div>
      </div>
      
      <!-- Utility actions -->
      <div class="flex justify-between items-center text-xs text-zinc-500 dark:text-space-textMuted mt-1">
        <button on:click={toggleVoice} class="flex items-center gap-2 hover:text-black dark:hover:text-space-textHighlight transition-colors">
          {#if $voiceEnabled}
            <Volume2 size={14} strokeWidth={1.5} />
            <span>{$t('interview.mute')}</span>
          {:else}
            <VolumeX size={14} strokeWidth={1.5} />
            <span>{$t('interview.listen')}</span>
          {/if}
        </button>
        
        <button on:click={endInterview} disabled={$isProcessing} class="flex items-center gap-2 text-red-500 dark:text-[#a05252] hover:text-red-700 dark:hover:text-[#d36b6b] transition-colors font-medium disabled:opacity-50">
          <Flag size={14} strokeWidth={1.5} />
          <span>{$t('interview.finish')}</span>
        </button>
      </div>
    {/if}
  </div>
</div>
