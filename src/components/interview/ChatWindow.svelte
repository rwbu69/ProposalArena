<script lang="ts">
  import { currentMessages, askNextQuestion } from '../../lib/interview/controller';
  import { handsFreeEnabled } from '../../lib/state/stores';
  import { handsFreeState, requestMicrophonePermission, isSpeechRecognitionSupported } from '../../lib/voice/handsFreeEngine';
  import { afterUpdate } from 'svelte';
  import { t } from 'svelte-i18n';
  import { marked } from 'marked';
  
  let scrollContainer: HTMLDivElement;
  
  afterUpdate(() => {
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  });

  function parseMarkdown(text: string) {
    return marked.parse(text);
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
          Penguji AI akan membaca intisari metodologi dan rumusan masalah dari proposal Anda, lalu mengajukan pertanyaan secara bertahap.
        </p>
      </div>

      <div class="pt-4 flex flex-col items-start gap-4">
        <button 
          on:click={() => askNextQuestion()}
          class="px-6 py-2.5 bg-accent hover:bg-accent-hover text-white text-xs font-mono tracking-wider transition-colors"
        >
          {$t('interview.start')} →
        </button>

        <button 
          on:click={toggleHandsFreeStaging}
          class="flex items-center gap-2 text-xs font-mono text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark transition-colors pt-1"
        >
          <span>{$t('interview.handsFreeToggle')}:</span>
          <span class="underline underline-offset-4 {$handsFreeEnabled ? 'font-medium text-ink dark:text-ink-dark' : 'text-ink-faint'}">
            {$handsFreeEnabled ? 'Aktif (Mikrofon & Audio)' : 'Nonaktif'}
          </span>
        </button>
      </div>
    </div>
  {:else}
    <!-- DIALOGUE TRANSCRIPT: Pure Editorial Typography, No Inverted Black Bubbles -->
    <div class="max-w-2xl mx-auto space-y-8 pb-10">
      {#each $currentMessages as msg, i (msg.id)}
        <div class="pb-8 border-b border-hairline dark:border-hairline-dark space-y-3">
          <div class="flex items-center justify-between text-[11px] font-mono text-ink-faint dark:text-ink-faint-dark">
            <span class="uppercase tracking-widest font-medium">
              {msg.role === 'assistant' ? 'Penguji' : 'Kandidat'}
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
            <span class="inline-block w-1.5 h-1.5 rounded-full bg-accent dark:bg-accent-dark"></span>
            <span>Kandidat (Sedang Berbicara...)</span>
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
