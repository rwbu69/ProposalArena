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

<div class="flex flex-col lg:flex-row w-full h-full min-h-0 overflow-hidden bg-paper dark:bg-paper-dark font-sans text-ink dark:text-ink-dark">
  <!-- LEFT PANEL: PDF / Document Viewer (50% width) -->
  <div class="w-full lg:w-[50%] h-[50vh] lg:h-full bg-paper dark:bg-paper-dark flex flex-col border-b lg:border-b-0 lg:border-r border-hairline dark:border-hairline-dark relative">
    
    <!-- Viewer Header -->
    <div class="px-6 py-4 border-b border-hairline dark:border-hairline-dark flex justify-between items-center shrink-0 z-10 bg-paper dark:bg-paper-dark">
      <div class="min-w-0 pr-4">
        <span class="text-[10px] uppercase tracking-widest font-mono text-ink-faint dark:text-ink-faint-dark block mb-0.5">
          {$t('app.document')}
        </span>
        <h2 class="font-serif text-sm sm:text-base font-normal tracking-tight text-ink dark:text-ink-dark truncate">
          {$currentProposal?.title || $t('app.unknownTitle')}
        </h2>
      </div>

      <div class="flex items-center gap-3 text-ink-faint dark:text-ink-faint-dark font-mono text-xs shrink-0">
        <span>PDF</span>
      </div>
    </div>

    <!-- Viewer Content Area -->
    <div data-pdf-viewer="true" class="flex-1 flex overflow-hidden bg-paper-surface dark:bg-paper-surface-dark relative">
      {#if pdfUrl}
        <embed id="proposal-pdf-embed" src={pdfUrl} type="application/pdf" class="w-full h-full" />
      {:else}
        <!-- Clean Editorial Paper Fallback -->
        <div class="flex-1 overflow-y-auto doc-scroll p-8 sm:p-14 lg:p-16 flex justify-center">
          <div class="w-full max-w-xl text-ink dark:text-ink-dark font-serif space-y-6">
            <h1 class="text-xl sm:text-2xl font-normal tracking-tight pb-4 border-b border-hairline dark:border-hairline-dark">
              {$currentProposal?.title || 'Dokumen Proposal'}
            </h1>
            <div class="prose dark:prose-invert max-w-none text-ink dark:text-ink-dark font-serif text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
              {$currentProposal?.text || $t('app.noText')}
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- RIGHT PANEL: Arena Ujian / Examination Chamber (50% width) -->
  <div class="w-full lg:w-[50%] h-[50vh] lg:h-full bg-paper dark:bg-paper-dark relative flex flex-col justify-between">
    
    <!-- Top Header -->
    <div class="px-6 py-4 border-b border-hairline dark:border-hairline-dark flex justify-between items-center shrink-0 z-10 bg-paper dark:bg-paper-dark">
      <div>
        <span class="font-serif text-sm sm:text-base font-normal tracking-tight text-ink dark:text-ink-dark">
          {$t('app.interview')}
        </span>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-4 text-xs font-mono text-ink-muted dark:text-ink-muted-dark">
        <button
          on:click={goHome}
          class="hover:text-ink dark:hover:text-ink-dark transition-colors"
          title="Keluar / Home"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </button>
        <button
          on:click={toggleLanguage}
          class="hover:text-ink dark:hover:text-ink-dark transition-colors uppercase tracking-wider"
        >
          {$uiLanguage}
        </button>
        <button
          on:click={() => $showSettings = true}
          class="hover:text-ink dark:hover:text-ink-dark transition-colors p-1"
          title={$t('settings.title')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>
      </div>
    </div>
    
    <!-- Dialogue Area -->
    <div class="flex-1 flex flex-col relative z-10 overflow-hidden h-full">
      <ChatWindow />
    </div>
    
    <!-- Input & Controls Area -->
    <div class="relative z-10 shrink-0 border-t border-hairline dark:border-hairline-dark bg-paper dark:bg-paper-dark">
      <Controls />
    </div>
  </div>
</div>
