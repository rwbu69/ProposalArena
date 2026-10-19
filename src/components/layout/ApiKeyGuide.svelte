<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { showSettings } from '../../lib/state/stores';
  import { loadSettings } from '../../lib/storage/settings';
  import Icon from '../common/Icon.svelte';

  let hasApiKey = false;
  let providerName = 'Google Gemini';

  function checkKeyStatus() {
    const s = loadSettings();
    hasApiKey = Boolean(s?.apiKey && s.apiKey.trim().length > 5);
    if (s?.providerId === 'openrouter') providerName = 'OpenRouter';
    else if (s?.providerId === 'openai') providerName = 'OpenAI';
    else providerName = 'Google Gemini';
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

<div class="w-full pt-4 border-t border-hairline dark:border-hairline-dark">
  {#if hasApiKey}
    <div class="flex items-center justify-between text-xs py-2">
      <div class="flex items-center gap-2">
        <Icon name="key" size={14} class="text-accent dark:text-accent-dark shrink-0" />
        <span class="font-mono text-ink-muted dark:text-ink-muted-dark">API Key:</span>
        <span class="text-ink dark:text-ink-dark font-medium">{providerName}</span>
      </div>
      <button
        type="button"
        on:click={() => ($showSettings = true)}
        class="inline-flex items-center gap-1.5 font-mono text-[11px] text-ink-faint dark:text-ink-faint-dark hover:text-ink dark:hover:text-ink-dark transition-colors underline underline-offset-2 px-2 py-1 rounded-xs focus:outline-none focus-visible:ring-1 focus-visible:ring-ink dark:focus-visible:ring-ink-dark"
        aria-label={$t('landing.settingsAria')}
      >
        <Icon name="settings" size={12} />
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
        <span class="text-[10px] font-mono uppercase tracking-wider text-ink-faint dark:text-ink-faint-dark">
          {$t('tutorial.badgeFree')}
        </span>
      </div>
      <p class="text-xs text-ink-muted dark:text-ink-muted-dark leading-relaxed font-sans">
        {$t('tutorial.privacyNote')}
      </p>
      <div class="flex items-center gap-3 pt-1 text-xs">
        <button
          type="button"
          on:click={() => ($showSettings = true)}
          class="inline-flex items-center gap-1 font-mono text-xs text-ink dark:text-ink-dark underline underline-offset-4 hover:text-ink-muted dark:hover:text-ink-muted-dark transition-colors px-1.5 py-1 rounded-xs focus:outline-none focus-visible:ring-1 focus-visible:ring-ink dark:focus-visible:ring-ink-dark"
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
          class="inline-flex items-center gap-1 font-mono text-xs text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark transition-colors px-1.5 py-1 rounded-xs focus:outline-none focus-visible:ring-1 focus-visible:ring-ink dark:focus-visible:ring-ink-dark"
          aria-label="Google AI Studio (eksternal)"
        >
          <span>Google AI Studio</span>
          <Icon name="external-link" size={12} />
        </a>
      </div>
    </div>
  {/if}
</div>
