<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { currentSession } from '../../lib/interview/controller';
  import { integrityWarnings } from '../../lib/state/stores';
  import { dbStore } from '../../lib/db/database';
  import { AlertTriangle } from 'lucide-svelte';
  import { get } from 'svelte/store';
  import { t } from 'svelte-i18n';

  let hideTimeout: any;
  let blurTimeout: any;
  let focusInterval: any;
  let lastInterruptionTime = 0;
  let wasDocumentFocused = true;

  function handleInterruption() {
    if (!$currentSession) return;

    // Prevent duplicate warnings within 1.5 seconds (e.g. concurrent blur and visibilitychange)
    const now = Date.now();
    if (now - lastInterruptionTime < 1500) return;
    lastInterruptionTime = now;
    
    // Increment interruptions
    const updatedSession = { ...$currentSession, interruptions: $currentSession.interruptions + 1 };
    currentSession.set(updatedSession);
    dbStore.saveSession(updatedSession); // Background save
    
    // Show warning toast
    $integrityWarnings = get(t)('integrity.warning');
    
    if (hideTimeout) clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
      $integrityWarnings = null;
    }, 5000);
  }

  function isEmbeddedViewer(el: Element | null): boolean {
    if (!el) return false;
    const tag = el.tagName ? el.tagName.toUpperCase() : '';
    if (tag === 'EMBED' || tag === 'IFRAME' || tag === 'OBJECT') return true;
    if (el.closest && (el.closest('[data-pdf-viewer]') || el.closest('#proposal-pdf-embed'))) return true;
    return false;
  }

  function onVisibilityChange() {
    if (document.hidden) {
      handleInterruption();
    }
  }

  function onBlur() {
    if (blurTimeout) clearTimeout(blurTimeout);

    blurTimeout = setTimeout(() => {
      if (typeof document === 'undefined') return;

      // When clicking inside an embedded PDF (<embed> or <iframe>),
      // the window dispatches a blur event, but the document or inner embedded viewer retains focus.
      if (document.hasFocus() || isEmbeddedViewer(document.activeElement)) {
        return;
      }

      handleInterruption();
    }, 150);
  }

  function onFocus() {
    if (blurTimeout) {
      clearTimeout(blurTimeout);
      blurTimeout = null;
    }
    wasDocumentFocused = true;
  }

  onMount(() => {
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);

    // Heartbeat check in case user switches applications while focus was inside the embedded viewer
    focusInterval = setInterval(() => {
      if (typeof document === 'undefined') return;
      const hasFocus = document.hasFocus();

      if (!hasFocus && wasDocumentFocused) {
        wasDocumentFocused = false;
        if (!isEmbeddedViewer(document.activeElement) || !document.hasFocus()) {
          handleInterruption();
        }
      } else if (hasFocus && !wasDocumentFocused) {
        wasDocumentFocused = true;
      }
    }, 500);
  });

  onDestroy(() => {
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisibilityChange);
    if (typeof window !== 'undefined') {
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
    }
    if (blurTimeout) clearTimeout(blurTimeout);
    if (focusInterval) clearInterval(focusInterval);
    if (hideTimeout) clearTimeout(hideTimeout);
  });
</script>

{#if $integrityWarnings}
  <div class="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-8 duration-300">
    <div class="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 border-l-4 border-l-black dark:border-l-white text-black dark:text-white p-4 shadow-xl flex items-start gap-3 max-w-md">
      <AlertTriangle class="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div>
        <h3 class="font-bold text-sm">{$t('integrity.title')}</h3>
        <p class="text-sm mt-1 text-zinc-600 dark:text-zinc-400">{$integrityWarnings}</p>
      </div>
    </div>
  </div>
{/if}
