<script lang="ts">
  import { submitAnswer, isProcessing, endInterview, currentProposal, currentMessages, endingStatusMessage } from '../../lib/interview/controller';
  import { voiceEnabled, handsFreeEnabled, handsFreePrivacyAcknowledged } from '../../lib/state/stores';
  import { SpeechDictation, stopSpeaking } from '../../lib/voice/speech';
  import { handsFreeState, requestMicrophonePermission, isSpeechRecognitionSupported } from '../../lib/voice/handsFreeEngine';
  import { t } from 'svelte-i18n';
  import Icon from '../common/Icon.svelte';
  import ConfirmModal from '../common/ConfirmModal.svelte';
  
  let text = '';
  let isRecording = false;
  let dictation: SpeechDictation | null = null;
  let showPrivacyModal = false;
  let showFinishModal = false;
  
  $: isStaging = $currentMessages.length === 0;

  function handleConfirmEndInterview() {
    showFinishModal = true;
  }

  function finishInterview() {
    showFinishModal = false;
    endInterview();
  }
  
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
              <Icon name="volume" size={16} class="text-ink dark:text-ink-dark shrink-0" />
              <span class="text-ink dark:text-ink-dark font-medium">
                {$t('interview.examinerSpeaking')}
              </span>
            {:else if $handsFreeState.status === 'listening'}
              <!-- Mic open indicator -->
              <span class="relative flex h-2 w-2 mr-0.5">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
              </span>
              <Icon name="mic" size={16} class="text-red-600 shrink-0" />
              <span class="text-ink dark:text-ink-dark font-medium">
                {$t('interview.listeningAnswer')}
              </span>
            {:else if $handsFreeState.status === 'countdown'}
              <Icon name="clock" size={16} class="text-accent dark:text-accent-dark shrink-0" />
              <span class="text-ink dark:text-ink-dark">
                {$t('interview.sendingCountdown', { values: { seconds: ($handsFreeState.countdownMs / 1000).toFixed(1) } })}
              </span>
            {:else if $handsFreeState.status === 'examiner_thinking' || $isProcessing}
              <Icon name="loader" size={16} class="animate-spin text-ink-muted dark:text-ink-muted-dark shrink-0" />
              <span class="text-ink-muted dark:text-ink-muted-dark">
                {$endingStatusMessage || $t('interview.examinerThinking')}
              </span>
            {:else}
              <Icon name="mic" size={16} class="text-accent dark:text-accent-dark shrink-0" />
              <span class="text-ink-muted dark:text-ink-muted-dark">
                {$t('interview.handsFreeActive')}
              </span>
            {/if}
          </div>

          <!-- Switch to manual typing -->
          <button
            type="button"
            on:click={() => ($handsFreeEnabled = false)}
            class="inline-flex items-center gap-1.5 text-ink-faint hover:text-ink dark:hover:text-ink-dark transition-colors underline underline-offset-2 px-2 py-1 rounded-xs focus:outline-none focus-visible:ring-1 focus-visible:ring-ink dark:focus-visible:ring-ink-dark"
            aria-label={$t('interview.switchToTypingAria')}
          >
            <Icon name="keyboard" size={14} />
            <span>{$t('interview.switchToTyping')}</span>
          </button>
        </div>

        <div class="flex justify-end pt-1">
          <button
            type="button"
            on:click={handleConfirmEndInterview}
            disabled={$isProcessing}
            class="inline-flex items-center gap-1.5 text-xs font-mono text-ink-faint hover:text-red-700 dark:hover:text-red-400 transition-colors disabled:opacity-40 px-2 py-1 rounded-xs focus:outline-none focus-visible:ring-1 focus-visible:ring-red-600"
            aria-label={$t('interview.finishAria')}
          >
            <Icon name="square" size={14} class="text-red-600" />
            <span>{$t('interview.finish')}</span>
          </button>
        </div>
      </div>
    {:else}
      <!-- QUIET TYPED INPUT -->
      <div class="space-y-3">
        {#if $endingStatusMessage}
          <div class="flex items-center gap-2 text-xs font-mono text-ink-muted dark:text-ink-muted-dark pb-0.5">
            <Icon name="loader" size={14} class="animate-spin text-ink-muted dark:text-ink-muted-dark shrink-0" />
            <span>{$endingStatusMessage}</span>
          </div>
        {/if}
        <div class="relative w-full">
          <textarea 
            bind:value={text}
            on:keydown={handleKeydown}
            on:input={autoResize}
            disabled={$isProcessing}
            rows="1" 
            placeholder={$isProcessing ? ($endingStatusMessage || $t('interview.waiting')) : $t('interview.placeholder')}
            class="w-full bg-transparent border-b border-hairline dark:border-hairline-dark focus:border-ink dark:focus:border-ink-dark text-ink dark:text-ink-dark text-sm sm:text-base resize-none outline-none py-2.5 pr-20 transition-colors placeholder:text-ink-faint disabled:opacity-40"
          ></textarea>
          
          <div class="absolute right-0 bottom-1.5 flex items-center gap-1.5">
            <!-- Manual Voice Dictation (Touch target >= 40px) -->
            <button 
              type="button"
              on:click={toggleDictation}
              disabled={$isProcessing}
              class="w-10 h-10 flex items-center justify-center rounded-xs transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-ink dark:focus-visible:ring-ink-dark {isRecording ? 'text-red-600' : 'text-ink-faint hover:text-ink dark:hover:text-ink-dark'}" 
              aria-label={$t('interview.dictateAria')}
              title={$t('interview.dictateTooltip')}>
              <Icon name={isRecording ? 'mic-off' : 'mic'} size={18} />
            </button>
            <!-- Send -->
            <button 
              type="button"
              on:click={handleSubmit}
              disabled={!text.trim() || $isProcessing}
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-accent hover:bg-accent-hover dark:bg-accent-dark dark:hover:bg-accent-dark-hover text-paper dark:text-paper-dark rounded-xs transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:focus-visible:ring-accent-dark focus-visible:ring-offset-1 focus-visible:ring-offset-paper dark:focus-visible:ring-offset-paper-dark" 
              aria-label={$t('interview.sendAria')}
              title={$t('interview.send')}>
              <Icon name="send" size={14} />
              <span>{$t('interview.send')}</span>
            </button>
          </div>
        </div>
        
        <!-- Utility actions bar -->
        <div class="flex justify-between items-center text-xs font-mono text-ink-faint dark:text-ink-faint-dark pt-1">
          <div class="flex items-center gap-3 sm:gap-5">
            <!-- Voice Toggle -->
            <button 
              type="button"
              on:click={toggleVoice} 
              class="inline-flex items-center gap-1.5 hover:text-ink dark:hover:text-ink-dark transition-colors px-2 py-1 rounded-xs focus:outline-none focus-visible:ring-1 focus-visible:ring-ink dark:focus-visible:ring-ink-dark"
              aria-label={$t('interview.voiceToggleAria')}
            >
              <Icon name={$voiceEnabled ? 'volume' : 'volume-x'} size={15} />
              <span>{$voiceEnabled ? $t('interview.mute') : $t('interview.listen')}</span>
            </button>

            <!-- Hands-Free Defense Toggle -->
            <button 
              type="button"
              on:click={toggleHandsFree}
              disabled={$isProcessing}
              class="inline-flex items-center gap-1.5 hover:text-ink dark:hover:text-ink-dark transition-colors font-medium px-2 py-1 rounded-xs focus:outline-none focus-visible:ring-1 focus-visible:ring-ink dark:focus-visible:ring-ink-dark {$handsFreeEnabled ? 'text-accent dark:text-accent-dark' : ''}"
              aria-label={$t('interview.handsFreeToggleAria')}
            >
              <Icon name={$handsFreeEnabled ? 'mic' : 'mic-off'} size={15} />
              <span>{$t('interview.handsFreeToggle')}</span>
            </button>
          </div>
          
          <!-- Finish Interview -->
          <button 
            type="button"
            on:click={handleConfirmEndInterview} 
            disabled={$isProcessing} 
            class="inline-flex items-center gap-1.5 hover:text-red-700 dark:hover:text-red-400 transition-colors disabled:opacity-40 px-2 py-1 rounded-xs focus:outline-none focus-visible:ring-1 focus-visible:ring-red-600"
            aria-label={$t('interview.finishAria')}
          >
            <Icon name="square" size={14} class="text-red-600" />
            <span>{$t('interview.finish')}</span>
          </button>
        </div>
      </div>
    {/if}
  {/if}
</div>

{#if showFinishModal}
  <ConfirmModal
    title={$t('interview.confirmTitle')}
    message={$t('interview.confirmFinish')}
    confirmLabel={$t('interview.confirmAction')}
    cancelLabel={$t('settings.cancel')}
    danger={true}
    on:confirm={finishInterview}
    on:cancel={() => (showFinishModal = false)}
  />
{/if}

<!-- FIRST-TIME PRIVACY NOTICE MODAL -->
{#if showPrivacyModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
    <div class="bg-paper dark:bg-paper-dark border border-hairline dark:border-hairline-dark max-w-md w-full p-6 text-ink dark:text-ink-dark space-y-4">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <Icon name="shield-check" size={20} class="text-accent dark:text-accent-dark shrink-0" />
          <h3 class="font-serif text-lg font-normal tracking-tight">{$t('interview.handsFreePrivacyTitle')}</h3>
        </div>
        <p class="text-[11px] font-mono text-ink-faint uppercase tracking-wider pl-7">Web Speech API Notice</p>
      </div>

      <p class="text-xs text-ink-muted dark:text-ink-muted-dark leading-relaxed font-sans">
        {$t('interview.handsFreePrivacyDesc')}
      </p>

      <div class="flex justify-end gap-3 pt-3 border-t border-hairline dark:border-hairline-dark font-mono text-xs">
        <button
          type="button"
          on:click={() => (showPrivacyModal = false)}
          class="px-3 py-1.5 text-ink-muted hover:text-ink dark:hover:text-ink-dark transition-colors rounded-xs focus:outline-none focus-visible:ring-1 focus-visible:ring-ink dark:focus-visible:ring-ink-dark"
        >
          {$t('interview.handsFreePrivacyCancel')}
        </button>
        <button
          type="button"
          on:click={handleAcceptPrivacy}
          class="inline-flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover dark:bg-accent-dark dark:hover:bg-accent-dark-hover text-paper dark:text-paper-dark transition-colors rounded-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:focus-visible:ring-accent-dark"
        >
          <Icon name="check" size={16} />
          <span>{$t('interview.handsFreePrivacyAccept')}</span>
        </button>
      </div>
    </div>
  </div>
{/if}
