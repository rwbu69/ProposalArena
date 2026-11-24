<script lang="ts">
  import ChatWindow from '../interview/ChatWindow.svelte';
  import Controls from '../interview/Controls.svelte';
  import IntegrityMonitor from '../interview/IntegrityMonitor.svelte';
  import Icon from '../common/Icon.svelte';
  import { currentProposal, currentSession, MAX_QUESTIONS, isProcessing, endingStatusMessage, endInterview, exitActiveSession } from '../../lib/interview/controller';
  import { uiLanguage, showSettings } from '../../lib/state/stores';
  import { onDestroy, onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import ConfirmModal from '../common/ConfirmModal.svelte';
  
  let pdfUrl = '';
  $: if ($currentProposal?.fileData) {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    const blob = new Blob([$currentProposal.fileData], { type: 'application/pdf' });
    pdfUrl = URL.createObjectURL(blob);
  }

  let currentTime = Date.now();
  let timerInterval: ReturnType<typeof setInterval> | null = null;
  let mobilePanel: 'proposal' | 'interview' = 'interview';
  let showExitModal = false;
  let hasAutoEndedOnTimeout = false;

  onMount(() => {
    timerInterval = setInterval(() => {
      currentTime = Date.now();
    }, 1000);
  });
  
  onDestroy(() => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    if (timerInterval) clearInterval(timerInterval);
  });

  $: timeLimitMinutes = $currentSession?.timeLimitMinutes;
  $: startedAt = $currentSession?.startedAt;

  $: remainingSeconds = (timeLimitMinutes && startedAt)
    ? Math.max(0, Math.floor((startedAt + timeLimitMinutes * 60 * 1000 - currentTime) / 1000))
    : null;

  $: isLastMinute = remainingSeconds !== null && remainingSeconds < 60 && remainingSeconds > 0;

  $: formattedRemainingTime = remainingSeconds !== null
    ? `${Math.floor(remainingSeconds / 60)}:${(remainingSeconds % 60).toString().padStart(2, '0')}`
    : '';

  $: if (
    remainingSeconds === 0 &&
    !hasAutoEndedOnTimeout &&
    !$isProcessing &&
    $currentSession &&
    !['COMPLETED', 'REPORT_GENERATION', 'REPORT_READY'].includes($currentSession.state)
  ) {
    hasAutoEndedOnTimeout = true;
    const isId = ($currentProposal?.language || 'id') === 'id';
    endingStatusMessage.set(
      isId
        ? 'Waktu habis, sesi diakhiri otomatis. Catatan sedang disusun...'
        : 'Time is up. Ending session automatically and compiling notes...'
    );
    endInterview();
  }

  function toggleLanguage() {
    const currentLang = uiLanguage.get();
    uiLanguage.set(currentLang === 'en' ? 'id' : 'en');
  }

  function goHome() {
    showExitModal = true;
  }

  async function exitSession() {
    showExitModal = false;
    await exitActiveSession();
  }
</script>

<IntegrityMonitor />

<div class="flex flex-col lg:flex-row w-full h-full min-h-0 overflow-hidden bg-paper dark:bg-paper-dark font-sans text-ink dark:text-ink-dark">
  <div class="lg:hidden shrink-0 flex border-b border-hairline dark:border-hairline-dark bg-paper dark:bg-paper-dark" role="group" aria-label={$t('arena.mobileView')}>
    <button type="button" on:click={() => (mobilePanel = 'proposal')} class="flex-1 px-3.5 py-2.5 text-xs font-sans font-medium transition-colors {mobilePanel === 'proposal' ? 'bg-ink text-paper dark:bg-ink-dark dark:text-paper-dark' : 'text-ink-muted dark:text-ink-muted-dark hover:text-ink'}">
      {$t('arena.proposalView')}
    </button>
    <button type="button" on:click={() => (mobilePanel = 'interview')} class="flex-1 px-3.5 py-2.5 text-xs font-sans font-medium transition-colors {mobilePanel === 'interview' ? 'bg-ink text-paper dark:bg-ink-dark dark:text-paper-dark' : 'text-ink-muted dark:text-ink-muted-dark hover:text-ink'}">
      {$t('arena.interviewView')}
    </button>
  </div>

  {#if showExitModal}
    <ConfirmModal
      title={$t('arena.confirmTitle')}
      message={$t('arena.confirmExit')}
      confirmLabel={$t('arena.confirmAction')}
      cancelLabel={$t('settings.cancel')}
      danger={true}
      on:confirm={exitSession}
      on:cancel={() => (showExitModal = false)}
    />
  {/if}
  <!-- LEFT PANEL: PDF / Document Viewer (50% width) -->
  <div class="w-full lg:w-[50%] h-full bg-paper dark:bg-paper-dark flex flex-col border-b lg:border-b-0 lg:border-r border-hairline dark:border-hairline-dark relative {mobilePanel === 'proposal' ? 'flex' : 'hidden'} lg:flex">
    
    <!-- Viewer Header -->
    <div class="px-6 py-4 border-b border-hairline dark:border-hairline-dark flex justify-between items-center shrink-0 z-10 bg-paper dark:bg-paper-dark">
      <div class="min-w-0 pr-4">
        <span class="text-[11px] font-sans font-medium text-ink-muted dark:text-ink-muted-dark block mb-0.5">
          {$t('app.document')}
        </span>
        <h2 class="font-serif text-sm sm:text-base font-medium tracking-tight text-ink dark:text-ink-dark truncate">
          {$currentProposal?.title || $t('app.unknownTitle')}
        </h2>
      </div>

      <div class="flex items-center gap-2 text-ink-muted dark:text-ink-muted-dark font-sans text-xs shrink-0">
        <span class="px-2 py-0.5 rounded border border-hairline dark:border-hairline-dark text-[11px] font-medium">PDF</span>
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
  <div class="w-full lg:w-[50%] h-full bg-paper dark:bg-paper-dark relative {mobilePanel === 'interview' ? 'flex' : 'hidden'} lg:flex flex-col justify-between">
    
    <!-- Top Header -->
    <div class="px-6 py-4 border-b border-hairline dark:border-hairline-dark flex justify-between items-center shrink-0 z-10 bg-paper dark:bg-paper-dark">
      <div class="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-wrap">
        <span class="font-serif text-sm sm:text-base font-medium tracking-tight text-ink dark:text-ink-dark shrink-0">
          {$t('app.interview')}
        </span>
        {#if $currentSession && $currentSession.questionIndex > 0}
          <span class="text-xs font-sans text-ink-muted dark:text-ink-muted-dark shrink-0">
            ({Math.min($currentSession.questionIndex, MAX_QUESTIONS)}/{MAX_QUESTIONS})
          </span>
          {#if formattedRemainingTime}
            <span
              class="text-xs font-mono inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-hairline/40 dark:bg-hairline-dark/40 shrink-0 {isLastMinute ? 'text-amber-700 dark:text-amber-400 font-medium' : 'text-ink-muted dark:text-ink-muted-dark'}"
              title={$t('interview.timeRemaining')}
              aria-label={$t('interview.timeRemainingAria', { values: { time: formattedRemainingTime } })}
            >
              <Icon name="clock" size={12} class="opacity-70" />
              <span>{formattedRemainingTime}</span>
            </span>
          {/if}
        {/if}
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-1.5 text-xs font-sans text-ink-muted dark:text-ink-muted-dark">
        <button
          type="button"
          on:click={goHome}
          class="w-10 h-10 flex items-center justify-center rounded-lg hover:text-ink dark:hover:text-ink-dark transition-colors hover:bg-hairline/40 dark:hover:bg-hairline-dark/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink dark:focus-visible:ring-ink-dark cursor-pointer"
          aria-label={$t('arena.exitAria')}
          title={$t('arena.exitTooltip')}
        >
          <Icon name="home" size={16} />
        </button>
        <button
          type="button"
          on:click={toggleLanguage}
          class="min-w-[40px] min-h-[40px] px-3 py-2 rounded-md hover:text-ink dark:hover:text-ink-dark transition-colors font-medium border border-hairline/80 dark:border-hairline-dark/80 hover:bg-hairline/40 dark:hover:bg-hairline-dark/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink dark:focus-visible:ring-ink-dark cursor-pointer flex items-center justify-center"
          aria-label={$t('landing.toggleLanguageAria')}
          title={$t('landing.toggleLanguage')}
        >
          {$uiLanguage === 'id' ? 'ID' : 'EN'}
        </button>
        <button
          type="button"
          on:click={() => showSettings.set(true)}
          class="w-10 h-10 flex items-center justify-center rounded-lg hover:text-ink dark:hover:text-ink-dark transition-colors hover:bg-hairline/40 dark:hover:bg-hairline-dark/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink dark:focus-visible:ring-ink-dark cursor-pointer"
          aria-label={$t('landing.settingsAria')}
          title={$t('settings.title')}
        >
          <Icon name="settings" size={16} />
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
