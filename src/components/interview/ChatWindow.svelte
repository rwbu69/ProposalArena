<script lang="ts">
  import { currentMessages, askNextQuestion, selectedTimeLimit, setTimeLimit } from '../../lib/interview/controller';
  import { handsFreeEnabled } from '../../lib/state/stores';
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
        <span class="text-[10px] font-mono uppercase tracking-widest text-ink-faint dark:text-ink-faint-dark">
          {$t('interview.stagingTitle')}
        </span>
        <h3 class="font-serif text-2xl sm:text-3xl font-normal text-ink dark:text-ink-dark tracking-tight leading-snug">
          {$t('interview.stagingSubtitle')}
        </h3>
        <p class="text-sm text-ink-muted dark:text-ink-muted-dark leading-relaxed font-sans pt-1">
          {$t('interview.stagingDescription')}
        </p>
      </div>

      <div class="pt-2 flex flex-col items-start gap-5">
        <!-- Quiet Time Limit Selector -->
        <div class="space-y-2 w-full">
          <div class="flex items-center gap-1.5 text-xs font-mono text-ink-muted dark:text-ink-muted-dark">
            <Icon name="clock" size={14} class="text-ink-faint dark:text-ink-faint-dark shrink-0" />
            <span>{$t('interview.timerLabel')}:</span>
          </div>
          <div class="flex flex-wrap gap-1.5" role="group" aria-label={$t('interview.timerLabel')}>
            {#each [0, 15, 20, 30] as limit}
              <button
                type="button"
                on:click={() => setTimeLimit(limit)}
                class="px-2.5 py-1 text-xs font-mono rounded-xs border transition-colors cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-ink dark:focus-visible:ring-ink-dark {$selectedTimeLimit === limit ? 'bg-ink text-paper dark:bg-ink-dark dark:text-paper-dark border-transparent font-medium' : 'bg-transparent text-ink-muted dark:text-ink-muted-dark border-hairline dark:border-hairline-dark hover:border-ink dark:hover:border-ink-dark'}"
              >
                {getTimerLabel(limit)}
              </button>
            {/each}
          </div>
          <p class="text-[11px] font-sans text-ink-faint dark:text-ink-faint-dark">
            {$t('interview.timerHelper')}
          </p>
        </div>

        <button 
          type="button"
          on:click={() => askNextQuestion()}
          class="inline-flex items-center gap-2.5 px-6 py-2.5 bg-accent hover:bg-accent-hover dark:bg-accent-dark dark:hover:bg-accent-dark-hover text-paper dark:text-paper-dark text-xs font-mono tracking-wider transition-colors rounded-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:focus-visible:ring-accent-dark focus-visible:ring-offset-2 focus-visible:ring-offset-paper dark:focus-visible:ring-offset-paper-dark"
          aria-label={$t('interview.startAria')}
        >
          <Icon name="play" size={16} />
          <span>{$t('interview.start')}</span>
        </button>

        <div class="space-y-1">
          <button 
            type="button"
            on:click={toggleHandsFreeStaging}
            class="inline-flex items-center gap-2 text-xs font-mono text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark transition-colors rounded-xs focus:outline-none focus-visible:ring-1 focus-visible:ring-ink dark:focus-visible:ring-ink-dark px-1.5 py-1"
            aria-label={$t('interview.handsFreeToggleAria')}
          >
            <Icon name={$handsFreeEnabled ? 'mic' : 'mic-off'} size={16} class={$handsFreeEnabled ? 'text-accent dark:text-accent-dark' : 'text-ink-faint'} />
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
          <div class="flex items-center justify-between text-[11px] font-mono text-ink-faint dark:text-ink-faint-dark">
            <span class="uppercase tracking-widest font-medium">
              {msg.role === 'assistant' ? $t('interview.examiner') : $t('interview.candidate')}
            </span>
            <span class="text-[10px]">
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
    </div>
  {/if}
</div>
