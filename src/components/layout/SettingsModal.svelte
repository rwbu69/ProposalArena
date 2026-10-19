<script lang="ts">
  import Icon from '../common/Icon.svelte';
  import { loadSettings, saveSettings, clearSettings } from '../../lib/storage/settings';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { uiLanguage as uiLanguageStore, theme as themeStore } from '../../lib/state/stores';
  import { applyTheme } from '../../lib/state/theme';
  import { dbStore } from '../../lib/db/database';
  import ConfirmModal from '../common/ConfirmModal.svelte';
  
  export let isOpen = false;
  
  const OPENROUTER_DEFAULT = 'nvidia/nemotron-3-ultra-550b-a55b:free, nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free, nvidia/nemotron-3.5-lightning:free, nvidia/nemotron-3-super-120b-a12b:free, thinkingmachines/inkling:free, poolside/laguna-s-2.1:free';

  let providerId = 'gemini';
  let model = 'gemini-3.5-flash-lite';
  let apiKey = '';
  let proxyUrl = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
  let uiLanguage: 'en' | 'id' = 'en';
  let themeVal: 'system' | 'light' | 'dark' = 'system';
  let confirmation: 'clear' | 'reset' | null = null;

  function initFromStorage() {
    const s = loadSettings();
    if (s) {
      providerId = s.providerId ?? 'gemini';
      model = s.model ?? 'gemini-3.5-flash-lite';
      apiKey = s.apiKey ?? '';
      proxyUrl = s.proxyUrl ?? 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
      uiLanguage = uiLanguageStore.get() || s.uiLanguage || 'en';
      themeVal = themeStore.get() || s.theme || 'system';
    } else {
      providerId = 'gemini';
      model = 'gemini-3.5-flash-lite';
      apiKey = '';
      proxyUrl = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
      uiLanguage = uiLanguageStore.get() || 'en';
      themeVal = themeStore.get() || 'system';
    }
  }

  onMount(() => {
    initFromStorage();
  });

  // Re-read storage ONLY when modal transitions from closed to open
  let lastOpenState = false;
  $: if (isOpen && !lastOpenState) {
    lastOpenState = true;
    initFromStorage();
  } else if (!isOpen && lastOpenState) {
    lastOpenState = false;
  }

  function handleThemeChange() {
    applyTheme(themeVal);
  }

  function handleProviderChange() {
    if (providerId === 'openrouter') {
      model = OPENROUTER_DEFAULT;
      proxyUrl = 'https://openrouter.ai/api/v1/chat/completions';
    } else if (providerId === 'openai') {
      model = 'gpt-4o-mini';
      proxyUrl = 'https://api.openai.com/v1/chat/completions';
    } else if (providerId === 'gemini') {
      model = 'gemini-3.5-flash-lite';
      proxyUrl = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
    }
  }
  
  function save() {
    saveSettings({
      providerId,
      model: model.trim(),
      apiKey: apiKey.trim(),
      proxyUrl: proxyUrl.trim(),
      uiLanguage,
      theme: themeVal
    });
    uiLanguageStore.set(uiLanguage);
    themeStore.set(themeVal);
    applyTheme(themeVal);
    isOpen = false;
  }

  function handleClear() {
    confirmation = 'clear';
  }

  function clearStoredSettings() {
    confirmation = null;
    clearSettings();
    providerId = 'gemini';
    model = 'gemini-3.5-flash-lite';
    apiKey = '';
    proxyUrl = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
    themeVal = 'system';
    themeStore.set('system');
    applyTheme('system');
    isOpen = false;
  }

  async function exportData() {
    const data = await dbStore.exportData();
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `proposal-arena-export-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function resetData() {
    confirmation = 'reset';
  }

  async function clearStoredData() {
    confirmation = null;
    await dbStore.clearAllData();
    clearSettings();
    window.location.reload();
  }

  function close() {
    // Revert un-saved preview back to persisted theme
    applyTheme(themeStore.get());
    isOpen = false;
  }
</script>

{#if isOpen}
<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
  <div class="bg-paper dark:bg-paper-dark w-full max-w-lg shadow-none flex flex-col border border-hairline dark:border-hairline-dark text-ink dark:text-ink-dark">
    
    <!-- Modal Header -->
    <div class="px-6 py-4 border-b border-hairline dark:border-hairline-dark flex justify-between items-center bg-paper dark:bg-paper-dark">
      <h2 class="font-serif text-lg font-normal tracking-tight text-ink dark:text-ink-dark">
        {$t('settings.title')}
      </h2>
      <button 
        type="button"
        on:click={close} 
        class="w-10 h-10 flex items-center justify-center rounded-xs text-ink-muted hover:text-ink dark:hover:text-ink-dark transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-ink dark:focus-visible:ring-ink-dark" 
        aria-label={$t('settings.closeAria')}
        title={$t('settings.cancel')}
      >
        <Icon name="x" size={18} />
      </button>
      <div class="flex items-center gap-3">
        <button
          type="button"
          on:click={exportData}
          class="text-xs font-mono text-ink-muted hover:text-ink dark:hover:text-ink-dark transition-colors px-2 py-1.5"
        >
          {$t('settings.exportData')}
        </button>
        <button
          type="button"
          on:click={resetData}
          class="text-xs font-mono text-red-700 dark:text-red-400 hover:underline px-2 py-1.5"
        >
          {$t('settings.resetData')}
        </button>
      </div>

    </div>
    
    <!-- Modal Body -->
    <div class="p-6 space-y-5 overflow-y-auto max-h-[70vh] doc-scroll">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label for="settings-language-select" class="block text-xs font-mono uppercase tracking-wider text-ink-muted dark:text-ink-muted-dark mb-1.5">
            {$t('settings.language')}
          </label>
          <select id="settings-language-select" bind:value={uiLanguage} class="w-full border border-hairline dark:border-hairline-dark rounded-none p-2.5 focus:border-accent text-sm bg-paper dark:bg-paper-dark text-ink dark:text-ink-dark outline-none">
            <option value="en">English</option>
            <option value="id">Bahasa Indonesia</option>
          </select>
        </div>

        <div>
          <label for="settings-theme-select" class="block text-xs font-mono uppercase tracking-wider text-ink-muted dark:text-ink-muted-dark mb-1.5">
            {$t('settings.theme')}
          </label>
          <select
            id="settings-theme-select"
            bind:value={themeVal}
            on:change={handleThemeChange}
            class="w-full border border-hairline dark:border-hairline-dark rounded-none p-2.5 focus:border-accent text-sm bg-paper dark:bg-paper-dark text-ink dark:text-ink-dark outline-none"
          >
            <option value="system">{$t('settings.themeSystem')}</option>
            <option value="light">{$t('settings.themeLight')}</option>
            <option value="dark">{$t('settings.themeDark')}</option>
          </select>
        </div>
      </div>
      
      <div>
        <label for="settings-provider-select" class="block text-xs font-mono uppercase tracking-wider text-ink-muted dark:text-ink-muted-dark mb-1.5">
          {$t('settings.provider')}
        </label>
        <select id="settings-provider-select" bind:value={providerId} on:change={handleProviderChange} class="w-full border border-hairline dark:border-hairline-dark rounded-none p-2.5 focus:border-accent text-sm bg-paper dark:bg-paper-dark text-ink dark:text-ink-dark outline-none">
          <option value="gemini">Google Gemini</option>
          <option value="openrouter">OpenRouter</option>
          <option value="openai">OpenAI</option>
        </select>
        <p class="text-[11px] font-sans text-ink-faint dark:text-ink-faint-dark mt-1">
          {$t('settings.providerHint')}
        </p>
      </div>
      
      <div>
        <label for="settings-model-input" class="block text-xs font-mono uppercase tracking-wider text-ink-muted dark:text-ink-muted-dark mb-1.5">
          {$t('settings.model')}
        </label>
        <textarea id="settings-model-input" bind:value={model} rows="2" class="w-full border border-hairline dark:border-hairline-dark rounded-none p-2.5 focus:border-accent bg-paper dark:bg-paper-dark text-ink dark:text-ink-dark outline-none font-mono text-xs resize-y"></textarea>
        <p class="text-[11px] font-sans text-ink-faint dark:text-ink-faint-dark mt-1">
          {$t('settings.modelHint')}
        </p>
      </div>
      
      <div>
        <label for="settings-proxy-input" class="block text-xs font-mono uppercase tracking-wider text-ink-muted dark:text-ink-muted-dark mb-1.5">
          {$t('settings.proxy')}
        </label>
        <input id="settings-proxy-input" type="text" bind:value={proxyUrl} class="w-full border border-hairline dark:border-hairline-dark rounded-none p-2.5 focus:border-accent text-xs font-mono bg-paper dark:bg-paper-dark text-ink dark:text-ink-dark outline-none" />
        <p class="text-[11px] font-sans text-ink-faint dark:text-ink-faint-dark mt-1">
          {$t('settings.proxyHint')}
        </p>
      </div>
      
      <div>
        <label for="settings-apikey-input" class="block text-xs font-mono uppercase tracking-wider text-ink-muted dark:text-ink-muted-dark mb-1.5">
          <span class="inline-flex items-center gap-1.5">
            <Icon name="key" size={13} class="text-ink-faint shrink-0" />
            <span>{$t('settings.apiKey')}</span>
          </span>
        </label>
        <input id="settings-apikey-input" type="password" bind:value={apiKey} placeholder="Paste API Key here..." class="w-full border border-hairline dark:border-hairline-dark rounded-none p-2.5 focus:border-accent text-xs font-mono bg-paper dark:bg-paper-dark text-ink dark:text-ink-dark outline-none" />
        <p class="text-[11px] font-sans text-ink-faint dark:text-ink-faint-dark mt-1">
          {$t('settings.apiHint')}
        </p>
      </div>
    </div>
    
    <!-- Modal Footer -->
    <div class="px-6 py-4 border-t border-hairline dark:border-hairline-dark flex items-center justify-between bg-paper dark:bg-paper-dark">
      <button
        type="button"
        on:click={handleClear}
        class="inline-flex items-center gap-1.5 text-xs font-mono text-ink-faint hover:text-red-700 dark:hover:text-red-400 transition-colors underline underline-offset-2 px-2 py-1.5 rounded-xs focus:outline-none focus-visible:ring-1 focus-visible:ring-red-600"
      >
        <Icon name="trash" size={14} />
        <span>{$t('settings.clear')}</span>
      </button>

      <div class="flex items-center gap-3">
        <button
          type="button"
          on:click={close}
          class="text-xs font-mono text-ink-muted hover:text-ink dark:hover:text-ink-dark transition-colors px-3 py-2 rounded-xs focus:outline-none focus-visible:ring-1 focus-visible:ring-ink dark:focus-visible:ring-ink-dark"
        >
          {$t('settings.cancel')}
        </button>
        <button
          type="button"
          on:click={save}
          class="inline-flex items-center gap-2 px-5 py-2 bg-accent hover:bg-accent-hover text-white dark:bg-accent-dark dark:hover:bg-accent-dark-hover dark:text-paper-dark text-xs font-mono tracking-wider transition-colors rounded-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:focus-visible:ring-accent-dark"
        >
          <Icon name="check" size={16} />
          <span>{$t('settings.save')}</span>
        </button>
      </div>
    </div>
  </div>
</div>
{#if confirmation === 'clear'}
  <ConfirmModal
    title={$t('settings.confirmTitle')}
    message={$t('settings.confirmClear')}
    confirmLabel={$t('settings.confirmAction')}
    cancelLabel={$t('settings.cancel')}
    danger={true}
    on:confirm={clearStoredSettings}
    on:cancel={() => (confirmation = null)}
  />
{:else if confirmation === 'reset'}
  <ConfirmModal
    title={$t('settings.confirmTitle')}
    message={$t('settings.confirmResetData')}
    confirmLabel={$t('settings.deleteAction')}
    cancelLabel={$t('settings.cancel')}
    danger={true}
    on:confirm={clearStoredData}
    on:cancel={() => (confirmation = null)}
  />
{/if}
{/if}
