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
  
  function save() {
    saveSettings({
      providerId,
      model,
      apiKey,
      uiLanguage
    });
    uiLanguageStore.set(uiLanguage);
    
    // Give some feedback
    alert("Settings saved!");
  }
</script>

<div class="p-6">
  <h2 class="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
    <Settings size={20} class="text-slate-500" />
    AI Examiner Settings
  </h2>
  
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
      <label class="block text-sm font-medium text-slate-700 mb-1">Model Name (comma-separated for fallback)</label>
      <textarea bind:value={model} placeholder="e.g. google/gemma-2-9b-it:free" class="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[80px] resize-y"></textarea>
    </div>
    
    <div>
      <label class="block text-sm font-medium text-slate-700 mb-1">API Key</label>
      <input type="password" bind:value={apiKey} placeholder="sk-or-v1-..." class="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
      <p class="text-xs text-slate-500 mt-1">Stored locally in your browser.</p>
    </div>
  </div>
  
  <div class="mt-8 flex justify-end">
    <button on:click={save} class="w-full py-2 bg-slate-800 text-white hover:bg-slate-900 rounded-lg font-medium transition-colors">
      Save Settings
    </button>
  </div>
</div>
