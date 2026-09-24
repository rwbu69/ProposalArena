<script lang="ts">
  import { Settings, Home } from 'lucide-svelte';
  import { t } from 'svelte-i18n';
  import { uiLanguage } from '../../lib/state/stores';
  import { currentSession } from '../../lib/interview/controller';
  import SettingsModal from './SettingsModal.svelte';
  
  let showSettings = false;

  function toggleLanguage() {
    const currentLang = uiLanguage.get();
    uiLanguage.set(currentLang === 'en' ? 'id' : 'en');
  }
</script>

<header class="w-full bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between z-40 relative">
  <div class="flex items-center gap-4 text-black dark:text-white">
    <button class="flex items-center hover:opacity-80 transition-opacity" title="Home" on:click={() => window.location.reload()}>
      <Home size={24} strokeWidth={2.5} />
    </button>
  </div>
  
  <div class="flex items-center gap-4">
    <button 
      on:click={toggleLanguage}
      class="px-3 py-1.5 text-sm font-medium rounded-sm border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-black dark:text-white transition-colors"
      title="Toggle Language">
      {$uiLanguage === 'id' ? '🇮🇩 ID' : '🇬🇧 EN'}
    </button>
    
    <button 
      on:click={() => showSettings = true}
      class="p-2 rounded-sm border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
      title={$t('settings.title')}>
      <Settings size={20} />
    </button>
  </div>
</header>

{#if showSettings}
  <SettingsModal bind:isOpen={showSettings} />
{/if}
