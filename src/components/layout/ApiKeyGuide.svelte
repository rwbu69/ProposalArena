<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { showSettings } from '../../lib/state/stores';
  import { loadSettings } from '../../lib/storage/settings';
  import Icon from '../common/Icon.svelte';

  let hasApiKey = false;
  let isProxy = false;
  let providerName = 'Google Gemini';

  function checkKeyStatus() {
    const s = loadSettings();
    const proxyUrl = import.meta.env.PUBLIC_AI_PROXY_URL || s?.proxyUrl;
    isProxy = Boolean(proxyUrl && proxyUrl.startsWith('/'));
    hasApiKey = isProxy || Boolean(s?.apiKey && s.apiKey.trim().length > 5);
    providerName = isProxy ? 'Server Proxy (Mode Presentasi)' : 'Google Gemini';
  }

  onMount(() => {
    checkKeyStatus();
    window.addEventListener('focus', checkKeyStatus);
    return () => window.removeEventListener('focus', checkKeyStatus);
  });

  $: if (!$showSettings) {
    checkKeyStatus();
  }
</script>

<div class="w-full pt-5 border-t border-hairline/70 dark:border-hairline-dark/70">
  {#if hasApiKey}
    <div class="flex items-center justify-between text-xs py-1.5">
      <div class="flex items-center gap-2">
        <Icon name="shield-check" size={14} class="text-accent dark:text-accent-dark shrink-0" />
        <span class="text-xs font-sans text-ink-muted dark:text-ink-muted-dark">
          {isProxy ? 'Server Proxy Aktif' : 'Google Gemini Connected'}
        </span>
        <span class="text-[11px] font-sans px-2 py-0.5 rounded-md bg-hairline/40 dark:bg-hairline-dark/40 text-ink-faint dark:text-ink-faint-dark">
          {isProxy ? 'Mode Sidang' : 'BYOK'}
        </span>
      </div>
      <button
        type="button"
        on:click={() => showSettings.set(true)}
        class="inline-flex items-center gap-1.5 text-xs font-sans text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark transition-colors px-2 py-1 rounded-md hover:bg-hairline/40 dark:hover:bg-hairline-dark/40 focus:outline-none"
        aria-label={$t('landing.settingsAria')}
      >
        <Icon name="settings" size={13} />
        <span>{$t('settings.title')}</span>
      </button>
    </div>
  {:else}
    <div class="py-3 space-y-2">
      <div class="flex items-baseline justify-between">
        <div class="flex items-center gap-2">
          <Icon name="key" size={15} class="text-ink dark:text-ink-dark shrink-0" />
          <span class="font-serif text-sm font-medium text-ink dark:text-ink-dark">
            {$t('tutorial.title')}
          </span>
        </div>
        <span class="text-[11px] font-sans font-medium px-2 py-0.5 rounded-full bg-accent/10 dark:bg-accent-dark/15 text-accent dark:text-accent-dark">
          {$t('tutorial.badgeFree')}
        </span>
      </div>
      <p class="text-xs text-ink-muted dark:text-ink-muted-dark leading-relaxed font-sans">
        {$t('tutorial.privacyNote')}
      </p>
      <div class="flex items-center gap-3 pt-1 text-xs">
        <button
          type="button"
          on:click={() => showSettings.set(true)}
          class="inline-flex items-center gap-1.5 min-h-[40px] font-sans font-medium text-xs text-ink dark:text-ink-dark border border-hairline dark:border-hairline-dark bg-paper dark:bg-paper-dark hover:bg-hairline/40 dark:hover:bg-hairline-dark/40 transition-colors px-3 py-2 rounded-lg cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ink dark:focus-visible:ring-ink-dark"
          aria-label={$t('tutorial.openSettingsAria')}
        >
          <span>{$t('tutorial.openSettings')}</span>
          <Icon name="arrow-right" size={12} />
        </button>
        <span class="text-ink-faint dark:text-ink-faint-dark">•</span>
        <a
          href="https://aistudio.google.com"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1 font-sans font-medium text-xs text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark transition-colors px-1 py-0.5 rounded-md focus:outline-none"
          aria-label="Google AI Studio (eksternal)"
        >
          <span>Google AI Studio</span>
          <Icon name="external-link" size={12} />
        </a>
      </div>
    </div>
  {/if}
</div>
