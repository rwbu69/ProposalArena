<script lang="ts">
  import { currentMessages, askNextQuestion, selectedTimeLimit, setTimeLimit, isProcessing, processingStage, sessionError } from '../../lib/interview/controller';
  import { handsFreeEnabled, showSettings } from '../../lib/state/stores';
  import { handsFreeState, requestMicrophonePermission, isSpeechRecognitionSupported } from '../../lib/voice/handsFreeEngine';
  import { afterUpdate } from 'svelte';
  import { t } from 'svelte-i18n';
  import { marked } from 'marked';
  import { sanitizeHtml } from '../../lib/security/sanitize';
  import Icon from '../common/Icon.svelte';
  
  let scrollContainer: HTMLDivElement;
  
  afterUpdate(() => {
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  });

  function parseMarkdown(text: string) {
    return sanitizeHtml(marked.parse(text) as string);
  }

  function getTimerLabel(limit: number): string {
    if (limit === 0) return $t('interview.timerNone');
    if (limit === 15) return $t('interview.timer15');
    if (limit === 20) return $t('interview.timer20');
    if (limit === 30) return $t('interview.timer30');
    return `${limit} m`;
  }

  async function toggleHandsFreeStaging() {
    if ($handsFreeEnabled) {
      $handsFreeEnabled = false;
      return;
    }
    if (!isSpeechRecognitionSupported()) {
      alert($t('interview.handsFreeUnsupported'));
      return;
    }
    const hasPerm = await requestMicrophonePermission();
    if (!hasPerm) {
      alert($t('interview.handsFreePermissionDenied'));
      return;
    }
    $handsFreeEnabled = true;
  }
</script>

<div class="absolute inset-0 overflow-y-auto p-6 sm:p-10 lg:p-12 doc-scroll" bind:this={scrollContainer}>
  {#if $currentMessages.length === 0}
    <!-- STAGING STATE: Quiet, academic invitation to begin -->
    <div class="flex flex-col justify-center h-full max-w-md mx-auto text-left py-12 space-y-6">
      <div class="space-y-2">
        <span class="text-xs font-sans font-semibold uppercase tracking-wider text-accent dark:text-accent-dark">
          {$t('interview.stagingTitle')}
        </span>
        <h3 class="font-serif text-2xl sm:text-3xl font-medium text-ink dark:text-ink-dark tracking-tight leading-snug">
          {$t('interview.stagingSubtitle')}
        </h3>
        <p class="text-sm text-ink-muted dark:text-ink-muted-dark leading-relaxed font-sans pt-1">
          {$t('interview.stagingDescription')}
        </p>
      </div>

      {#if $isProcessing}
        <div class="flex items-center gap-2.5 text-xs font-sans text-ink-muted dark:text-ink-muted-dark py-2">
          <Icon name="loader" size={15} class="animate-spin text-accent dark:text-accent-dark shrink-0" />
          <span>
            {$processingStage === 'voice'
              ? $t('interview.preparingVoice')
              : $processingStage === 'question'
                ? $t('interview.preparingQuestion')
                : $t('interview.waiting')}
          </span>
        </div>
      {/if}

      {#if $sessionError}
        <div class="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-sans text-red-600 dark:text-red-400 space-y-2">
          <div class="flex items-start gap-2">
            <Icon name="alert-triangle" size={16} class="shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
            <span class="break-words flex-1 leading-relaxed">{$sessionError}</span>
          </div>
          <div class="pt-0.5">
            <button
              type="button"
              on:click={() => showSettings.set(true)}
              class="inline-flex items-center gap-1.5 min-h-[40px] px-2 text-xs font-sans font-medium text-ink dark:text-ink-dark underline underline-offset-4 hover:text-ink-muted cursor-pointer rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ink dark:focus-visible:ring-ink-dark"
            >
              <Icon name="settings" size={12} />
              <span>Periksa Pengaturan API →</span>
            </button>
          </div>
        </div>
      {/if}

      <div class="pt-2 flex flex-col items-start gap-5">
        <!-- Quiet Time Limit Selector -->
        <div class="space-y-2 w-full">
          <div class="flex items-center gap-1.5 text-xs font-sans font-medium text-ink-muted dark:text-ink-muted-dark">
            <Icon name="clock" size={14} class="text-ink-muted dark:text-ink-muted-dark shrink-0" />
            <span>{$t('interview.timerLabel')}:</span>
          </div>
          <div class="flex flex-wrap gap-1.5" role="group" aria-label={$t('interview.timerLabel')}>
            {#each [0, 15, 20, 30] as limit}
              <button
                type="button"
                on:click={() => setTimeLimit(limit)}
                disabled={$isProcessing}
                class="px-3 py-1.5 text-xs font-sans font-medium rounded-lg border transition-all cursor-pointer focus:outline-none disabled:opacity-50 {$selectedTimeLimit === limit ? 'bg-ink text-paper dark:bg-ink-dark dark:text-paper-dark border-transparent shadow-sm' : 'bg-transparent text-ink-muted dark:text-ink-muted-dark border-hairline dark:border-hairline-dark hover:border-ink-muted'}"
              >
                {getTimerLabel(limit)}
              </button>
            {/each}
          </div>
          <p class="text-[11px] font-sans text-ink-muted dark:text-ink-muted-dark">
            {$t('interview.timerHelper')}
          </p>
        </div>

        <button 
          type="button"
          on:click={() => askNextQuestion()}
          disabled={$isProcessing}
          class="inline-flex items-center gap-2.5 px-6 py-2.5 bg-ink hover:bg-ink/90 dark:bg-ink-dark dark:hover:bg-ink-dark/90 text-paper dark:text-paper-dark text-sm font-sans font-medium transition-all rounded-lg shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-ink dark:focus-visible:ring-ink-dark"
          aria-label={$t('interview.startAria')}
        >
          {#if $isProcessing}
            <Icon name="loader" size={16} class="animate-spin" />
            <span>
              {$processingStage === 'voice'
                ? $t('interview.preparingVoice')
                : $t('interview.preparingQuestion')}
            </span>
          {:else}
            <Icon name="play" size={16} />
            <span>{$t('interview.start')}</span>
          {/if}
        </button>

        <div class="space-y-1">
          <button 
            type="button"
            on:click={toggleHandsFreeStaging}
            class="inline-flex items-center gap-2 min-h-[40px] text-xs font-sans text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark transition-colors rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ink dark:focus-visible:ring-ink-dark cursor-pointer px-2.5 py-2"
            aria-label={$t('interview.handsFreeToggleAria')}
          >
            <Icon name={$handsFreeEnabled ? 'mic' : 'mic-off'} size={15} class={$handsFreeEnabled ? 'text-accent dark:text-accent-dark' : 'text-ink-faint'} />
            <span>{$t('interview.handsFreeToggle')}:</span>
            <span class="underline underline-offset-4 {$handsFreeEnabled ? 'font-medium text-ink dark:text-ink-dark' : 'text-ink-faint'}">
              {$handsFreeEnabled ? $t('interview.enabled') : $t('interview.disabled')}
            </span>
          </button>
          <p class="text-[11px] font-sans text-ink-faint dark:text-ink-faint-dark pl-1">
            {$t('interview.handsFreeHelper')}
          </p>
        </div>
      </div>
    </div>
  {:else}
    <!-- DIALOGUE TRANSCRIPT: Pure Editorial Typography, No Inverted Black Bubbles -->
    <div class="max-w-2xl mx-auto space-y-8 pb-10">
      {#each $currentMessages as msg, i (msg.id)}
        <div class="pb-8 border-b border-hairline dark:border-hairline-dark space-y-3">
          <div class="flex items-center justify-between text-xs font-sans text-ink-muted dark:text-ink-muted-dark">
            <span class="font-semibold uppercase tracking-wider text-[11px] {msg.role === 'assistant' ? 'text-accent dark:text-accent-dark' : 'text-ink-muted dark:text-ink-muted-dark'}">
              {msg.role === 'assistant' ? $t('interview.examiner') : $t('interview.candidate')}
            </span>
            <span class="font-mono text-[11px] text-ink-muted/80">
              {(i + 1).toString().padStart(2, '0')}
            </span>
          </div>

          {#if msg.role === 'assistant'}
            <!-- Examiner Question (Prominent, Elegant Serif) -->
            <div class="font-serif text-base sm:text-lg text-ink dark:text-ink-dark font-normal leading-relaxed prose prose-base dark:prose-invert max-w-none">
              {@html parseMarkdown(msg.content)}
            </div>
          {:else}
            <!-- Candidate Response (Crisp, Legible Sans) -->
            <div class="font-sans text-sm sm:text-base text-ink-muted dark:text-ink-muted-dark leading-relaxed font-normal prose prose-sm sm:prose-base dark:prose-invert max-w-none">
              {@html parseMarkdown(msg.content)}
            </div>
          {/if}
        </div>
      {/each}

      <!-- Live Spoken Transcript Preview in Hands-Free Mode -->
      {#if $handsFreeEnabled && ($handsFreeState.finalText || $handsFreeState.interimText)}
        <div class="pb-6 border-b border-hairline dark:border-hairline-dark space-y-2">
          <div class="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-ink-faint dark:text-ink-faint-dark">
            <Icon name="mic" size={14} class="text-red-600 animate-pulse" />
            <span>{$t('interview.liveSpeech')}</span>
          </div>
          <p class="font-sans text-sm sm:text-base text-ink dark:text-ink-dark leading-relaxed">
            {$handsFreeState.finalText}
            <span class="italic text-ink-muted dark:text-ink-muted-dark">{$handsFreeState.interimText}</span>
          </p>
        </div>
      {/if}

      {#if $isProcessing}
        <div class="flex items-center gap-2.5 text-xs font-sans text-ink-muted dark:text-ink-muted-dark py-2">
          <Icon name="loader" size={15} class="animate-spin text-accent dark:text-accent-dark shrink-0" />
          <span>
            {$processingStage === 'voice'
              ? $t('interview.preparingVoice')
              : $processingStage === 'question'
                ? $t('interview.preparingQuestion')
                : $t('interview.waiting')}
          </span>
        </div>
      {/if}

      {#if $sessionError}
        <div class="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-sans text-red-600 dark:text-red-400 space-y-2">
          <div class="flex items-start gap-2">
            <Icon name="alert-triangle" size={16} class="shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
            <span class="break-words flex-1 leading-relaxed">{$sessionError}</span>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
