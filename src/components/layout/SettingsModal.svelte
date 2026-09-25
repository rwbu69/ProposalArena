<script lang="ts">
  import { Settings, X } from 'lucide-svelte';
  import { loadSettings, saveSettings } from '../../lib/storage/settings';
  import { onMount, createEventDispatcher } from 'svelte';
  import { t } from 'svelte-i18n';
  import { uiLanguage as uiLanguageStore } from '../../lib/state/stores';
  
  export let isOpen = false;
  
  const OPENROUTER_DEFAULT = 'nvidia/nemotron-3-ultra-550b-a55b:free, nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free, nvidia/nemotron-3.5-lightning:free, nvidia/nemotron-3-super-120b-a12b:free, thinkingmachines/inkling:free, poolside/laguna-s-2.1:free';

  let providerId = 'gemini';
  let model = 'gemini-3.5-flash-lite';
  let apiKey = '';
  let proxyUrl = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
  let uiLanguage: 'en' | 'id' = 'en';

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
  
  onMount(() => {
    const s = loadSettings();
    if (s) {
      providerId = s.providerId || providerId;
      model = s.model || model;
      apiKey = s.apiKey || '';
      proxyUrl = s.proxyUrl || '';
      uiLanguage = uiLanguageStore.get() || s.uiLanguage || 'en';
    }
  });
  
  function save() {
    saveSettings({
      providerId,
      model,
      apiKey,
      proxyUrl,
      uiLanguage
    });
    uiLanguageStore.set(uiLanguage);
    isOpen = false;
  }

  function close() {
    isOpen = false;
  }
</script>

{#if isOpen}
<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
  <div class="bg-white dark:bg-zinc-950 w-full max-w-lg shadow-xl overflow-hidden flex flex-col border border-zinc-300 dark:border-zinc-800">
    
    <div class="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900">
      <h2 class="text-xl font-bold text-black dark:text-white flex items-center gap-2">
        <Settings size={20} class="text-zinc-500 dark:text-zinc-400" />
        {$t('settings.title')}
      </h2>
      <button on:click={close} class="p-1 text-zinc-400 hover:text-black dark:hover:text-white transition-colors">
        <X size={20} />
      </button>
    </div>
    
    <div class="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
      <div>
        <label class="block text-sm font-medium text-black dark:text-white mb-1">{$t('settings.language')}</label>
        <select bind:value={uiLanguage} class="w-full border border-zinc-300 dark:border-zinc-800 rounded-none p-2.5 focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white focus:outline-none bg-white dark:bg-zinc-950 dark:text-white">
          <option value="en">English</option>
          <option value="id">Bahasa Indonesia</option>
        </select>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-black dark:text-white mb-1">{$t('settings.provider')}</label>
        <select bind:value={providerId} on:change={handleProviderChange} class="w-full border border-zinc-300 dark:border-zinc-800 rounded-none p-2.5 focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white focus:outline-none bg-zinc-50 dark:bg-zinc-900 dark:text-white">
          <option value="openrouter">OpenRouter</option>
          <option value="openai">OpenAI</option>
          <option value="gemini">Google Gemini</option>
        </select>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-black dark:text-white mb-1">{$t('settings.model')}</label>
        <textarea bind:value={model} class="w-full border border-zinc-300 dark:border-zinc-800 rounded-none p-2.5 focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white focus:outline-none min-h-[80px] resize-y bg-white dark:bg-zinc-950 dark:text-white"></textarea>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-black dark:text-white mb-1">{$t('settings.proxy')}</label>
        <input type="text" bind:value={proxyUrl} class="w-full border border-zinc-300 dark:border-zinc-800 rounded-none p-2.5 focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white focus:outline-none bg-white dark:bg-zinc-950 dark:text-white" />
        <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{$t('settings.proxyHint')}</p>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-black dark:text-white mb-1">{$t('settings.apiKey')}</label>
        <input type="password" bind:value={apiKey} placeholder="sk-..." class="w-full border border-zinc-300 dark:border-zinc-800 rounded-none p-2.5 focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white focus:outline-none bg-white dark:bg-zinc-950 dark:text-white" />
        <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{$t('settings.apiHint')}</p>
      </div>
    </div>
    
    <div class="px-6 py-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
      <button on:click={save} class="px-6 py-2 bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors">
        {$t('settings.save')}
      </button>
    </div>
  </div>
</div>
{/if}
