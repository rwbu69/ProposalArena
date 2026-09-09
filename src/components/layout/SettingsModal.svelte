<script lang="ts">
  import { Settings, X } from 'lucide-svelte';
  import { loadSettings, saveSettings } from '../../lib/storage/settings';
  import { onMount } from 'svelte';
  
  const OPENROUTER_DEFAULT = 'nvidia/nemotron-3-ultra-550b-a55b:free, nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free, nvidia/nemotron-3.5-lightning:free, nvidia/nemotron-3-super-120b-a12b:free, thinkingmachines/inkling:free, poolside/laguna-s-2.1:free';

  let isOpen = false;
  
  let providerId = 'openrouter';
  let model = OPENROUTER_DEFAULT;
  let apiKey = '';
  import { uiLanguage as uiLanguageStore } from '../../lib/state/stores';
  let uiLanguage: 'en' | 'id' = 'en';

  function handleProviderChange() {
    if (providerId === 'openrouter') model = OPENROUTER_DEFAULT;
    else if (providerId === 'openai') model = 'gpt-4o-mini';
    else if (providerId === 'gemini') model = 'gemini-1.5-flash';
  }
  
  onMount(() => {
    const s = loadSettings();
    if (s) {
      providerId = s.providerId || providerId;
      model = s.model || model;
      apiKey = s.apiKey || '';
      uiLanguage = uiLanguageStore.get() || s.uiLanguage || 'en';
    }
  });
  
  function open() {
    const s = loadSettings();
    if (s) {
      providerId = s.providerId || providerId;
      model = s.model || model;
      apiKey = s.apiKey || '';
      uiLanguage = uiLanguageStore.get() || s.uiLanguage || 'en';
    }
    isOpen = true;
  }
  
  function close() {
    isOpen = false;
  }
  
  function save() {
    saveSettings({
      providerId,
      model,
      apiKey,
      uiLanguage
    });
    uiLanguageStore.set(uiLanguage);
    
    // In a real app we might want to dispatch an event to trigger i18n changes,
    // but a page reload is also fine for MVP or store updates.
    close();
  }
</script>

<button 
  on:click={open}
  class="fixed top-4 right-4 z-40 p-2 bg-white rounded-full shadow-md text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
  title="Settings">
  <Settings size={24} />
</button>

{#if isOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
    <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
      <button 
        on:click={close}
        class="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
        <X size={24} />
      </button>
      
      <h2 class="text-xl font-bold text-slate-800 mb-6">Settings</h2>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">UI Language</label>
          <select bind:value={uiLanguage} class="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none">
            <option value="en">English</option>
            <option value="id">Bahasa Indonesia</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">AI Provider</label>
          <select bind:value={providerId} on:change={handleProviderChange} class="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50">
            <option value="openrouter">OpenRouter</option>
            <option value="openai">OpenAI</option>
            <option value="gemini">Google Gemini</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Model Name</label>
          <input type="text" bind:value={model} placeholder="e.g. google/gemma-2-9b-it:free" class="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">API Key</label>
          <input type="password" bind:value={apiKey} placeholder="sk-or-v1-..." class="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          <p class="text-xs text-slate-500 mt-1">Stored locally in your browser.</p>
        </div>
      </div>
      
      <div class="mt-8 flex justify-end gap-3">
        <button on:click={close} class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">
          Cancel
        </button>
        <button on:click={save} class="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium">
          Save Settings
        </button>
      </div>
    </div>
  </div>
{/if}
