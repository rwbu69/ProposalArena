<script lang="ts">
  import { onMount } from 'svelte';
  import { slide, fade } from 'svelte/transition';
  import { t } from 'svelte-i18n';
  import { showSettings } from '../../lib/state/stores';
  import { loadSettings } from '../../lib/storage/settings';
  import {
    Key,
    ExternalLink,
    ChevronDown,
    ArrowRight,
    ArrowLeft,
    Check,
    Settings,
    ShieldCheck
  } from 'lucide-svelte';

  export let isExpanded = false;

  let currentStep = 1;
  const totalSteps = 5;
  let hasApiKey = false;

  function checkKeyStatus() {
    const s = loadSettings();
    hasApiKey = Boolean(s?.apiKey && s.apiKey.trim().length > 5);
  }

  onMount(() => {
    checkKeyStatus();
    // Re-check periodically or when window focuses
    window.addEventListener('focus', checkKeyStatus);
    return () => window.removeEventListener('focus', checkKeyStatus);
  });

  // Whenever showSettings closes, re-check key status
  $: if (!$showSettings) {
    checkKeyStatus();
  }

  function toggle() {
    isExpanded = !isExpanded;
    if (isExpanded) {
      checkKeyStatus();
    }
  }

  function nextStep() {
    if (currentStep < totalSteps) {
      currentStep += 1;
    } else {
      isExpanded = false;
      currentStep = 1;
    }
  }

  function prevStep() {
    if (currentStep > 1) {
      currentStep -= 1;
    }
  }

  function openSettingsModal() {
    $showSettings = true;
  }
</script>

<div class="w-full">
  <!-- TRIGGER BUTTON (ELEGANT COLLAPSED STATE) -->
  <button
    on:click={toggle}
    class="w-full flex items-center justify-between p-3.5 sm:p-4 border border-zinc-200 dark:border-space-borderSoft hover:border-black dark:hover:border-space-textSoft bg-zinc-50/80 dark:bg-space-viewer hover:bg-white dark:hover:bg-space-right transition-all duration-200 group text-left rounded-none"
  >
    <div class="flex items-center gap-3 min-w-0">
      <div class="w-7 h-7 flex items-center justify-center shrink-0 border border-zinc-200 dark:border-space-border bg-white dark:bg-space-left text-zinc-600 dark:text-space-textSoft group-hover:text-black dark:group-hover:text-space-textHighlight group-hover:border-black dark:group-hover:border-space-textSoft transition-colors">
        <Key class="w-3.5 h-3.5" />
      </div>
      <div class="min-w-0">
        <div class="text-xs sm:text-sm font-medium text-black dark:text-space-textHighlight tracking-tight truncate">
          {$t('tutorial.title')}
        </div>
        <div class="text-[11px] text-zinc-500 dark:text-space-textMuted font-light truncate mt-0.5">
          {$t('tutorial.subtitle')}
        </div>
      </div>
    </div>

    <div class="flex items-center gap-2.5 shrink-0 pl-3">
      {#if hasApiKey}
        <span class="inline-flex items-center gap-1 text-[10px] font-mono tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 border border-emerald-200 dark:border-emerald-800/50">
          <Check class="w-3 h-3" />
          <span class="hidden sm:inline">{$t('tutorial.statusConfigured')}</span>
        </span>
      {:else}
        <span class="text-[10px] font-mono tracking-wider text-zinc-600 dark:text-space-textSoft bg-zinc-100 dark:bg-space-active px-2 py-0.5 border border-zinc-200 dark:border-space-border">
          {$t('tutorial.badgeFree')}
        </span>
      {/if}
      <ChevronDown
        class="w-4 h-4 text-zinc-400 dark:text-space-textMuted group-hover:text-black dark:group-hover:text-space-textHighlight transition-transform duration-300 {isExpanded ? 'rotate-180' : ''}"
      />
    </div>
  </button>

  <!-- EXPANDED ANIMATED STEP-BY-STEP WALKTHROUGH -->
  {#if isExpanded}
    <div
      transition:slide={{ duration: 250 }}
      class="border-x border-b border-zinc-200 dark:border-space-borderSoft bg-white dark:bg-space-left p-5 sm:p-6 space-y-5"
    >
      <!-- STEP HEADER WITH PROGRESS PILLS -->
      <div class="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-space-borderSoft/60">
        <div class="flex items-center gap-2">
          <span class="font-mono text-xs uppercase tracking-widest text-zinc-500 dark:text-space-textMuted">
            {$t('tutorial.stepOf', { values: { current: currentStep.toString().padStart(2, '0'), total: totalSteps.toString().padStart(2, '0') } })}
          </span>
        </div>

        <!-- Progress Segments -->
        <div class="flex items-center gap-1">
          {#each Array(totalSteps) as _, i}
            <div
              class="w-4 h-1 transition-colors duration-200 {i + 1 === currentStep ? 'bg-black dark:bg-space-textHighlight' : i + 1 < currentStep ? 'bg-zinc-300 dark:bg-space-border' : 'bg-zinc-100 dark:bg-space-viewer'}"
            ></div>
          {/each}
        </div>
      </div>

      <!-- STEP CONTENT CONTAINER -->
      <div class="min-h-[110px] flex flex-col justify-center py-2" transition:fade={{ duration: 150 }}>
        {#if currentStep === 1}
          <div>
            <span class="font-mono text-[10px] uppercase tracking-wider text-zinc-400 dark:text-space-textMuted block mb-1">
              Langkah 01
            </span>
            <p class="text-sm text-zinc-800 dark:text-space-textHighlight font-normal leading-relaxed">
              {$t('tutorial.step1')}
            </p>
            <div class="mt-4">
              <a
                href="https://aistudio.google.com"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 px-3.5 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-zinc-200 text-xs font-mono tracking-wider transition-colors"
              >
                <span>{$t('tutorial.step1Action')}</span>
                <ExternalLink class="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        {:else if currentStep === 2}
          <div>
            <span class="font-mono text-[10px] uppercase tracking-wider text-zinc-400 dark:text-space-textMuted block mb-1">
              Langkah 02
            </span>
            <p class="text-sm text-zinc-800 dark:text-space-textHighlight font-normal leading-relaxed">
              {$t('tutorial.step2')}
            </p>
            <p class="text-xs text-zinc-500 dark:text-space-textMuted mt-2 font-light">
              Gunakan akun Google biasa (Gmail) untuk mendapatkan kuota gratis penggunaan model Gemini secara langsung.
            </p>
          </div>
        {:else if currentStep === 3}
          <div>
            <span class="font-mono text-[10px] uppercase tracking-wider text-zinc-400 dark:text-space-textMuted block mb-1">
              Langkah 03
            </span>
            <p class="text-sm text-zinc-800 dark:text-space-textHighlight font-normal leading-relaxed">
              {$t('tutorial.step3')}
            </p>
            <p class="text-xs text-zinc-500 dark:text-space-textMuted mt-2 font-light">
              Menu ini biasanya berada di panel samping kiri berlabel <strong class="text-black dark:text-white font-medium">"Get API key"</strong> dengan ikon kunci.
            </p>
          </div>
        {:else if currentStep === 4}
          <div>
            <span class="font-mono text-[10px] uppercase tracking-wider text-zinc-400 dark:text-space-textMuted block mb-1">
              Langkah 04
            </span>
            <p class="text-sm text-zinc-800 dark:text-space-textHighlight font-normal leading-relaxed">
              {$t('tutorial.step4')}
            </p>
            <p class="text-xs text-zinc-500 dark:text-space-textMuted mt-2 font-light">
              Pilih opsi buat kunci pada project baru (*Create in new project*), lalu tekan tombol salin (*Copy*).
            </p>
          </div>
        {:else if currentStep === 5}
          <div>
            <span class="font-mono text-[10px] uppercase tracking-wider text-zinc-400 dark:text-space-textMuted block mb-1">
              Langkah 05
            </span>
            <p class="text-sm text-zinc-800 dark:text-space-textHighlight font-normal leading-relaxed">
              {$t('tutorial.step5')}
            </p>
            <div class="mt-4 flex flex-wrap items-center gap-3">
              <button
                on:click={openSettingsModal}
                class="inline-flex items-center gap-2 px-3.5 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-zinc-200 text-xs font-mono tracking-wider transition-colors"
              >
                <Settings class="w-3.5 h-3.5" />
                <span>{$t('tutorial.openSettings')}</span>
              </button>
            </div>
          </div>
        {/if}
      </div>

      <!-- FOOTER CONTROLS & PRIVACY NOTE -->
      <div class="pt-4 border-t border-zinc-100 dark:border-space-borderSoft/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div class="flex items-center gap-1.5 text-[11px] text-zinc-400 dark:text-space-textMuted font-light">
          <ShieldCheck class="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span>Privasi lokal di browser Anda</span>
        </div>

        <div class="flex items-center gap-2 self-end sm:self-auto">
          {#if currentStep > 1}
            <button
              on:click={prevStep}
              class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono tracking-wider text-zinc-600 dark:text-space-textSoft hover:text-black dark:hover:text-space-textHighlight border border-zinc-200 dark:border-space-borderSoft bg-transparent hover:bg-zinc-50 dark:hover:bg-space-viewer transition-colors"
            >
              <ArrowLeft class="w-3 h-3" />
              <span>{$t('tutorial.prev')}</span>
            </button>
          {/if}

          <button
            on:click={nextStep}
            class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono tracking-wider text-black dark:text-space-textHighlight border border-zinc-300 dark:border-space-border bg-zinc-100 dark:bg-space-viewer hover:bg-zinc-200 dark:hover:bg-space-right transition-colors"
          >
            <span>{currentStep === totalSteps ? $t('tutorial.done') : $t('tutorial.next')}</span>
            {#if currentStep < totalSteps}
              <ArrowRight class="w-3 h-3" />
            {/if}
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>
