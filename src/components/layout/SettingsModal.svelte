<script lang="ts">
  import Icon from '../common/Icon.svelte';
  import { loadSettings, saveSettings, clearSettings } from '../../lib/storage/settings';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { uiLanguage as uiLanguageStore, theme as themeStore, showSettings } from '../../lib/state/stores';
  import { applyTheme } from '../../lib/state/theme';
  import { dbStore } from '../../lib/db/database';
  import ConfirmModal from '../common/ConfirmModal.svelte';
  
  export let isOpen: boolean | undefined = undefined;
  
  const configuredProxyUrl = import.meta.env.PUBLIC_AI_PROXY_URL || '';

  let providerId = 'gemini';
  let model = 'gemini-3.5-flash-lite';
  let apiKey = '';
  let proxyUrl = configuredProxyUrl || 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
  let uiLanguage: 'en' | 'id' = 'id';
  let themeVal: 'system' | 'light' | 'dark' = 'system';
  let confirmation: 'clear' | 'reset' | null = null;

  $: active = isOpen !== undefined ? isOpen : $showSettings;
  $: isProxyActive = Boolean(configuredProxyUrl || proxyUrl.startsWith('/'));

  function handleWindowKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && active && confirmation === null) {
      close();
    }
  }

  function initFromStorage() {
    const s = loadSettings();
    if (s) {
      providerId = 'gemini';
      model = configuredProxyUrl ? 'gemini-3.5-flash-lite' : (s.model ?? 'gemini-3.5-flash-lite');
      apiKey = s.apiKey ?? '';
      proxyUrl = configuredProxyUrl || s.proxyUrl || 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
      uiLanguage = uiLanguageStore.get() || s.uiLanguage || 'id';
      themeVal = themeStore.get() || s.theme || 'system';
    } else {
      providerId = 'gemini';
      model = 'gemini-3.5-flash-lite';
      apiKey = '';
      proxyUrl = configuredProxyUrl || 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
      uiLanguage = uiLanguageStore.get() || 'id';
      themeVal = themeStore.get() || 'system';
    }
  }

  onMount(() => {
    initFromStorage();
  });

  // Re-read storage ONLY when modal transitions from closed to open
  let lastActiveState = false;
  $: if (active && !lastActiveState) {
    lastActiveState = true;
    initFromStorage();
  } else if (!active && lastActiveState) {
    lastActiveState = false;
  }

  function handleThemeChange() {
    applyTheme(themeVal);
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
    if (isOpen !== undefined) isOpen = false;
    showSettings.set(false);
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
    if (isOpen !== undefined) isOpen = false;
    showSettings.set(false);
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
    if (isOpen !== undefined) isOpen = false;
    showSettings.set(false);
  }
</script>

<svelte:window on:keydown={handleWindowKeydown} />

{#if active}
<div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/40 dark:bg-black/60 backdrop-blur-xs" role="presentation" on:click|self={close}>
  <div class="bg-paper dark:bg-paper-dark w-full max-w-lg shadow-2xl flex flex-col border border-hairline dark:border-hairline-dark text-ink dark:text-ink-dark rounded-2xl overflow-hidden">
    
    <!-- Modal Header -->
    <div class="px-6 py-4.5 border-b border-hairline dark:border-hairline-dark flex justify-between items-center bg-paper dark:bg-paper-dark">
      <div class="flex items-center gap-2.5">
        <h2 class="font-serif text-xl font-medium tracking-tight text-ink dark:text-ink-dark">
          {$t('settings.title')}
        </h2>
      </div>

      <div class="flex items-center gap-1.5">
        <button
          type="button"
          on:click={exportData}
          class="min-h-[40px] text-xs font-sans font-medium text-ink-muted hover:text-ink dark:hover:text-ink-dark transition-colors px-3 py-2 rounded-md hover:bg-hairline/40 dark:hover:bg-hairline-dark/40 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ink dark:focus-visible:ring-ink-dark"
        >
          {$t('settings.exportData')}
        </button>
        <button
          type="button"
          on:click={resetData}
          class="min-h-[40px] text-xs font-sans font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors px-3 py-2 rounded-md hover:bg-red-500/10 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
        >
          {$t('settings.resetData')}
        </button>
        <button 
          type="button"
          on:click={close} 
          class="w-10 h-10 flex items-center justify-center rounded-lg text-ink-muted hover:text-ink dark:hover:text-ink-dark transition-colors hover:bg-hairline/40 dark:hover:bg-hairline-dark/40 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ink dark:focus-visible:ring-ink-dark" 
          aria-label={$t('settings.closeAria')}
          title={$t('settings.cancel')}
        >
          <Icon name="x" size={17} />
        </button>
      </div>

    </div>
    
    <!-- Modal Body -->
    <div class="p-6 space-y-5 overflow-y-auto max-h-[70vh] doc-scroll">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label for="settings-language-select" class="block text-xs font-sans font-medium text-ink dark:text-ink-dark mb-1.5">
            {$t('settings.language')}
          </label>
          <select id="settings-language-select" bind:value={uiLanguage} class="w-full border border-hairline dark:border-hairline-dark rounded-lg p-2.5 focus:border-accent text-xs sm:text-sm bg-paper dark:bg-paper-dark text-ink dark:text-ink-dark outline-none font-sans">
            <option value="en">English</option>
            <option value="id">Bahasa Indonesia</option>
          </select>
        </div>

        <div>
          <label for="settings-theme-select" class="block text-xs font-sans font-medium text-ink dark:text-ink-dark mb-1.5">
            {$t('settings.theme')}
          </label>
          <select
            id="settings-theme-select"
            bind:value={themeVal}
            on:change={handleThemeChange}
            class="w-full border border-hairline dark:border-hairline-dark rounded-lg p-2.5 focus:border-accent text-xs sm:text-sm bg-paper dark:bg-paper-dark text-ink dark:text-ink-dark outline-none font-sans"
          >
            <option value="system">{$t('settings.themeSystem')}</option>
            <option value="light">{$t('settings.themeLight')}</option>
            <option value="dark">{$t('settings.themeDark')}</option>
          </select>
        </div>
      </div>
      
      <div>
        <label for="settings-model-select" class="block text-xs font-sans font-medium text-ink dark:text-ink-dark mb-1.5">
          {$t('settings.model')}
        </label>
        <select id="settings-model-select" bind:value={model} disabled={isProxyActive} class="w-full border border-hairline dark:border-hairline-dark rounded-lg p-2.5 focus:border-accent text-xs sm:text-sm bg-paper dark:bg-paper-dark text-ink dark:text-ink-dark outline-none font-sans disabled:opacity-50 disabled:cursor-not-allowed">
          <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite (Rekomendasi: RPD Tinggi & Cepat)</option>
          <option value="gemini-3.8-flash">gemini-3.8-flash (Penalaran Akademik Mendalam)</option>
        </select>
        <p class="text-[11px] font-sans text-ink-muted dark:text-ink-muted-dark mt-1">
          {isProxyActive
            ? 'Model dikunci dan dikelola oleh Server Proxy.'
            : 'Ditenagai oleh Google Gemini API untuk penguji dan evaluasi sidang proposal.'}
        </p>
      </div>
      
      <div>
        <label for="settings-proxy-input" class="block text-xs font-sans font-medium text-ink dark:text-ink-dark mb-1.5">
          {$t('settings.proxy')}
        </label>
        <input id="settings-proxy-input" type="text" bind:value={proxyUrl} class="w-full border border-hairline dark:border-hairline-dark rounded-lg p-2.5 focus:border-accent text-xs font-mono bg-paper dark:bg-paper-dark text-ink dark:text-ink-dark outline-none" />
        <p class="text-[11px] font-sans text-ink-muted dark:text-ink-muted-dark mt-1">
          {$t('settings.proxyHint')}
        </p>
      </div>
      
      {#if configuredProxyUrl || proxyUrl.startsWith('/')}
        <div class="p-3.5 rounded-xl bg-accent/5 dark:bg-accent-dark/10 border border-accent/20 dark:border-accent-dark/20 flex items-start gap-3">
          <Icon name="shield-check" size={17} class="text-accent dark:text-accent-dark shrink-0 mt-0.5" />
          <div class="text-xs space-y-0.5">
            <span class="font-sans font-medium text-ink dark:text-ink-dark">Server Proxy Active (Mode Presentasi)</span>
            <p class="text-ink-muted dark:text-ink-muted-dark leading-relaxed font-sans">
              Request diproses aman melalui server proxy di <code class="font-mono text-[11px] bg-paper dark:bg-paper-dark px-1 py-0.5 rounded border border-hairline dark:border-hairline-dark">{proxyUrl}</code>. API Key kamu dikelola aman di server.
            </p>
          </div>
        </div>
      {/if}

      <div>
        <label for="settings-apikey-input" class="block text-xs font-sans font-medium text-ink dark:text-ink-dark mb-1.5">
          <span class="inline-flex items-center gap-1.5">
            <Icon name="key" size={13} class="text-ink-muted shrink-0" />
            <span>{$t('settings.apiKey')}</span>
          </span>
        </label>
        <input id="settings-apikey-input" type="password" bind:value={apiKey} disabled={isProxyActive} placeholder={isProxyActive ? 'Dikelola aman oleh Server Proxy' : 'Masukkan Gemini API Key di sini...'} class="w-full border border-hairline dark:border-hairline-dark rounded-lg p-2.5 focus:border-accent text-xs font-mono bg-paper dark:bg-paper-dark text-ink dark:text-ink-dark outline-none disabled:opacity-50 disabled:cursor-not-allowed" />
        <p class="text-[11px] font-sans text-ink-muted dark:text-ink-muted-dark mt-1">
          {isProxyActive
            ? 'Input API Key dinonaktifkan karena request menggunakan Server Proxy.'
            : $t('settings.apiHint')}
        </p>
      </div>
    </div>
    
    <!-- Modal Footer -->
    <div class="px-6 py-4 border-t border-hairline dark:border-hairline-dark flex items-center justify-between bg-paper dark:bg-paper-dark">
      <button
        type="button"
        on:click={handleClear}
        class="inline-flex items-center gap-1.5 min-h-[40px] text-xs font-sans font-medium text-ink-muted hover:text-red-600 dark:hover:text-red-400 transition-colors px-3 py-2 rounded-md cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
      >
        <Icon name="trash" size={14} />
        <span>{$t('settings.clear')}</span>
      </button>

      <div class="flex items-center gap-2.5">
        <button
          type="button"
          on:click={close}
          class="min-h-[40px] text-xs font-sans font-medium text-ink-muted hover:text-ink dark:hover:text-ink-dark transition-colors px-3.5 py-2 rounded-lg hover:bg-hairline/40 dark:hover:bg-hairline-dark/40 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ink dark:focus-visible:ring-ink-dark"
        >
          {$t('settings.cancel')}
        </button>
        <button
          type="button"
          on:click={save}
          class="inline-flex items-center gap-2 min-h-[40px] px-5 py-2 bg-ink hover:bg-ink/90 dark:bg-ink-dark dark:hover:bg-ink-dark/90 text-paper dark:text-paper-dark text-xs font-sans font-medium transition-all rounded-lg shadow-sm cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ink dark:focus-visible:ring-ink-dark"
        >
          <Icon name="check" size={15} />
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
