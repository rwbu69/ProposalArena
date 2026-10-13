<script lang="ts">
  import { submitAnswer, isProcessing, endInterview, currentProposal, currentMessages } from '../../lib/interview/controller';
  import { voiceEnabled, handsFreeEnabled, handsFreePrivacyAcknowledged } from '../../lib/state/stores';
  import { SpeechDictation, stopSpeaking } from '../../lib/voice/speech';
  import { handsFreeState, requestMicrophonePermission, isSpeechRecognitionSupported } from '../../lib/voice/handsFreeEngine';
  import { t } from 'svelte-i18n';
  
  let text = '';
  let isRecording = false;
  let dictation: SpeechDictation | null = null;
  let showPrivacyModal = false;
  
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

  async function toggleHandsFree() {
    if ($handsFreeEnabled) {
      $handsFreeEnabled = false;
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      alert($t('interview.handsFreeUnsupported'));
      return;
    }

    if (!$handsFreePrivacyAcknowledged) {
      showPrivacyModal = true;
      return;
    }

    await activateHandsFree();
  }

  async function handleAcceptPrivacy() {
    $handsFreePrivacyAcknowledged = true;
    showPrivacyModal = false;
    await activateHandsFree();
  }

  async function activateHandsFree() {
    const hasPerm = await requestMicrophonePermission();
    if (!hasPerm) {
      alert($t('interview.handsFreePermissionDenied'));
      $handsFreeEnabled = false;
      return;
    }
    $voiceEnabled = true;
    $handsFreeEnabled = true;
  }

  function toggleDictation() {
    if (isRecording) {
      dictation?.stop();
      isRecording = false;
      return;
    }
    
    const lang = $currentProposal?.language || 'id';
    if (!dictation || dictation.language !== lang) {
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

<div class="px-6 sm:px-10 py-5 bg-paper dark:bg-paper-dark">
  {#if !isStaging}
    {#if $handsFreeEnabled}
      <!-- UNDERSTATED HANDS-FREE STATE INDICATOR -->
      <div class="space-y-4">
        <div class="flex items-center justify-between text-xs font-mono">
          <div class="flex items-center gap-2.5">
            {#if $handsFreeState.status === 'examiner_speaking'}
              <span class="inline-block w-2 h-2 rounded-full bg-ink-faint"></span>
              <span class="text-ink-muted dark:text-ink-muted-dark">
                {$t('interview.examinerSpeaking')}
              </span>
            {:else if $handsFreeState.status === 'listening'}
              <!-- Single calm red indicator while mic is open -->
              <span class="inline-block w-2 h-2 rounded-full bg-red-600"></span>
              <span class="text-ink dark:text-ink-dark font-medium">
                {$t('interview.listeningAnswer')}
              </span>
            {:else if $handsFreeState.status === 'countdown'}
              <span class="inline-block w-2 h-2 rounded-full bg-accent dark:bg-accent-dark"></span>
              <span class="text-ink dark:text-ink-dark">
                {$t('interview.sendingCountdown', { values: { seconds: ($handsFreeState.countdownMs / 1000).toFixed(1) } })}
              </span>
            {:else if $handsFreeState.status === 'examiner_thinking' || $isProcessing}
              <span class="inline-block w-2 h-2 rounded-full bg-ink-faint animate-pulse"></span>
              <span class="text-ink-muted dark:text-ink-muted-dark">
                {$t('interview.examinerThinking')}
              </span>
            {:else}
              <span class="inline-block w-2 h-2 rounded-full bg-ink-faint"></span>
              <span class="text-ink-muted dark:text-ink-muted-dark">
                {$t('interview.handsFreeActive')}
              </span>
            {/if}
          </div>

          <!-- Switch to manual typing -->
          <button
            on:click={() => $handsFreeEnabled = false}
            class="text-ink-faint hover:text-ink dark:hover:text-ink-dark transition-colors underline underline-offset-2"
          >
            {$t('interview.switchToTyping')}
          </button>
        </div>

        <div class="flex justify-end pt-1">
          <button
            on:click={endInterview}
            disabled={$isProcessing}
            class="text-xs font-mono text-ink-faint hover:text-red-700 transition-colors disabled:opacity-40"
          >
            {$t('interview.finish')}
          </button>
        </div>
      </div>
    {:else}
      <!-- QUIET TYPED INPUT -->
      <div class="space-y-3">
        <div class="relative w-full">
          <textarea 
            bind:value={text}
            on:keydown={handleKeydown}
            on:input={autoResize}
            disabled={$isProcessing}
            rows="1" 
            placeholder={$isProcessing ? $t('interview.waiting') : $t('interview.placeholder')}
            class="w-full bg-transparent border-b border-hairline dark:border-hairline-dark focus:border-ink dark:focus:border-ink-dark text-ink dark:text-ink-dark text-sm sm:text-base resize-none outline-none py-2.5 pr-20 transition-colors placeholder:text-ink-faint disabled:opacity-40"
          ></textarea>
          
          <div class="absolute right-0 bottom-2.5 flex items-center gap-2">
            <!-- Manual Voice Dictation -->
            <button 
              on:click={toggleDictation}
              disabled={$isProcessing}
              class="p-1.5 transition-colors {isRecording ? 'text-red-600' : 'text-ink-faint hover:text-ink dark:hover:text-ink-dark'}" 
              title={$t('interview.dictate')}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" x2="12" y1="19" y2="22"></line>
              </svg>
            </button>
            <!-- Send -->
            <button 
              on:click={handleSubmit}
              disabled={!text.trim() || $isProcessing}
              class="px-2.5 py-1 text-xs font-mono text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark disabled:opacity-30 transition-colors" 
              title={$t('interview.send')}>
              {$t('interview.send') || 'Kirim'}
            </button>
          </div>
        </div>
        
        <!-- Utility actions bar -->
        <div class="flex justify-between items-center text-xs font-mono text-ink-faint dark:text-ink-faint-dark pt-1">
          <div class="flex items-center gap-5">
            <!-- Voice Toggle -->
            <button on:click={toggleVoice} class="hover:text-ink dark:hover:text-ink-dark transition-colors">
              {$voiceEnabled ? $t('interview.mute') : $t('interview.listen')}
            </button>

            <!-- Hands-Free Defense Toggle -->
            <button 
              on:click={toggleHandsFree}
              disabled={$isProcessing}
              class="hover:text-ink dark:hover:text-ink-dark transition-colors font-medium {$handsFreeEnabled ? 'text-accent dark:text-accent-dark' : ''}"
            >
              {$t('interview.handsFreeToggle')}
            </button>
          </div>
          
          <!-- Finish Interview -->
          <button on:click={endInterview} disabled={$isProcessing} class="hover:text-red-700 transition-colors disabled:opacity-40">
            {$t('interview.finish')}
          </button>
        </div>
      </div>
    {/if}
  {/if}
</div>

<!-- FIRST-TIME PRIVACY NOTICE MODAL -->
{#if showPrivacyModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
    <div class="bg-paper dark:bg-paper-dark border border-hairline dark:border-hairline-dark max-w-md w-full p-6 text-ink dark:text-ink-dark space-y-4">
      <div class="space-y-1">
        <h3 class="font-serif text-lg font-normal tracking-tight">{$t('interview.handsFreePrivacyTitle')}</h3>
        <p class="text-[11px] font-mono text-ink-faint uppercase tracking-wider">Web Speech API Notice</p>
      </div>

      <p class="text-xs text-ink-muted dark:text-ink-muted-dark leading-relaxed font-sans">
        {$t('interview.handsFreePrivacyDesc')}
      </p>

      <div class="flex justify-end gap-4 pt-3 border-t border-hairline dark:border-hairline-dark font-mono text-xs">
        <button
          on:click={() => showPrivacyModal = false}
          class="text-ink-muted hover:text-ink dark:hover:text-ink-dark transition-colors"
        >
          {$t('interview.handsFreePrivacyCancel')}
        </button>
        <button
          on:click={handleAcceptPrivacy}
          class="px-4 py-2 bg-accent hover:bg-accent-hover text-white transition-colors"
        >
          {$t('interview.handsFreePrivacyAccept')}
        </button>
      </div>
    </div>
  </div>
{/if}
