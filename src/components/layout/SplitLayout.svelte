<script lang="ts">
  import ChatWindow from '../interview/ChatWindow.svelte';
  import Controls from '../interview/Controls.svelte';
  import IntegrityMonitor from '../interview/IntegrityMonitor.svelte';
  import { currentProposal, currentSession } from '../../lib/interview/controller';
  import { uiLanguage, showSettings } from '../../lib/state/stores';
  import { onDestroy } from 'svelte';
  import { t } from 'svelte-i18n';
  
  let pdfUrl = '';
  $: if ($currentProposal?.fileData) {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    const blob = new Blob([$currentProposal.fileData], { type: 'application/pdf' });
    pdfUrl = URL.createObjectURL(blob);
  }
  
  onDestroy(() => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
  });

  function toggleLanguage() {
    const currentLang = uiLanguage.get();
    uiLanguage.set(currentLang === 'en' ? 'id' : 'en');
  }

  function goHome() {
    window.location.reload();
  }
</script>

<IntegrityMonitor />

<div class="flex flex-col lg:flex-row w-full h-full min-h-0 overflow-hidden bg-white dark:bg-space-left font-sans">
  <!-- LEFT PANEL: PDF / Document Viewer (50% width) -->
  <div class="w-full lg:w-[50%] h-[50vh] lg:h-full bg-white dark:bg-space-left flex flex-col border-b lg:border-b-0 lg:border-r border-zinc-200 dark:border-space-border relative">
    
    <!-- Viewer Header -->
    <div class="p-6 lg:p-8 pb-4 flex justify-between items-end shrink-0 z-10">
      <div>
        <p class="text-zinc-500 dark:text-space-textMuted text-[10px] uppercase tracking-[0.2em] mb-2 font-medium">
          {$t('app.document')}
        </p>
        <h2 class="text-black dark:text-space-textHighlight text-lg lg:text-xl font-medium tracking-tight">
          {$currentProposal?.title || $t('app.unknownTitle')}
        </h2>
      </div>

      <!-- Minimalist Toolbar -->
      <div class="flex gap-4 text-zinc-500 dark:text-space-textMuted text-sm items-center">
        <span class="text-zinc-600 dark:text-space-textSoft font-mono text-xs hidden sm:inline">100%</span>
      </div>
    </div>

    <!-- Viewer Content Area -->
    <div class="flex-1 flex overflow-hidden border-t border-zinc-200 dark:border-space-borderSoft bg-zinc-50 dark:bg-space-viewer relative">
      {#if pdfUrl}
        <embed src={pdfUrl} type="application/pdf" class="w-full h-full" />
      {:else}
        <!-- Paper Mockup -->
        <div class="flex-1 overflow-y-auto doc-scroll flex justify-center p-4 lg:p-12 relative">
          <div class="bg-white dark:bg-[#dcdcdc] w-full max-w-[650px] min-h-[900px] shadow-sm dark:shadow-2xl p-10 md:p-16 text-[#1a1a1a] font-serif flex flex-col items-center cursor-text border border-zinc-200 dark:border-none">
            <h1 class="text-xl md:text-2xl font-bold tracking-wide mt-12 mb-24 text-center">
              DOKUMEN PROPOSAL
            </h1>
            <div class="prose prose-sm md:prose-base max-w-none w-full text-[#1a1a1a] whitespace-pre-wrap text-left leading-relaxed">
              {$currentProposal?.text || $t('app.noText')}
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- RIGHT PANEL: Arena Ujian (50% width) -->
  <div class="w-full lg:w-[50%] h-[50vh] lg:h-full bg-zinc-50 dark:bg-space-right relative flex flex-col justify-between">
    <div class="noise-bg"></div>

    <!-- Top Navigation & Status -->
    <div class="p-6 lg:p-8 flex justify-between items-start z-10 shrink-0">
      <div>
        <span class="text-black dark:text-space-textHighlight text-lg font-medium tracking-tight">
          {$t('app.interview')}
        </span>
      </div>

      <!-- Global Actions -->
      <div class="flex gap-5 text-zinc-500 dark:text-space-textMuted items-center">
        <button on:click={goHome} class="hover:text-black dark:hover:text-space-textHighlight transition-colors" title="Keluar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </button>
        <button on:click={toggleLanguage} class="text-[11px] uppercase tracking-wider font-medium hover:text-black dark:hover:text-space-textHighlight transition-colors">
          {$uiLanguage}
        </button>
        <button on:click={() => $showSettings = true} class="hover:text-black dark:hover:text-space-textHighlight transition-colors" title="Pengaturan">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>
      </div>
    </div>
    
    <div class="flex-1 flex flex-col relative z-10 overflow-hidden h-full">
      <ChatWindow />
    </div>
    
    <div class="relative z-10 shrink-0">
      <Controls />
    </div>
  </div>
</div>
