<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { currentSession } from '../../lib/interview/controller';
  import { integrityWarnings } from '../../lib/state/stores';
  import { dbStore } from '../../lib/db/database';
  import { AlertTriangle } from 'lucide-svelte';

  let hideTimeout: any;

  function handleInterruption() {
    if (!$currentSession) return;
    
    // Increment interruptions
    const updatedSession = { ...$currentSession, interruptions: $currentSession.interruptions + 1 };
    currentSession.set(updatedSession);
    dbStore.saveSession(updatedSession); // Background save
    
    // Show warning toast
    $integrityWarnings = "Warning: We noticed you switched tabs or minimized the window. For the integrity of the examination, please remain focused.";
    
    if (hideTimeout) clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
      $integrityWarnings = null;
    }, 5000);
  }

  function onVisibilityChange() {
    if (document.hidden) {
      handleInterruption();
    }
  }

  function onBlur() {
    handleInterruption();
  }

  onMount(() => {
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);
  });

  onDestroy(() => {
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisibilityChange);
    if (typeof window !== 'undefined') window.removeEventListener('blur', onBlur);
    if (hideTimeout) clearTimeout(hideTimeout);
  });
</script>

{#if $integrityWarnings}
  <div class="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
    <div class="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4 rounded shadow-lg flex items-start gap-3 max-w-md">
      <AlertTriangle class="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div>
        <h3 class="font-bold text-sm">Session Integrity</h3>
        <p class="text-sm mt-1">{$integrityWarnings}</p>
      </div>
    </div>
  </div>
{/if}
