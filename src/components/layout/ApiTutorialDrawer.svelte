<script lang="ts">
  import { X, ExternalLink, Key, CheckCircle } from 'lucide-svelte';
  import { t } from 'svelte-i18n';
  import { fly, fade } from 'svelte/transition';
  
  export let isOpen = false;

  function close() {
    isOpen = false;
  }
</script>

{#if isOpen}
  <!-- Backdrop -->
  <div 
    class="fixed inset-0 z-50 bg-black/50" 
    transition:fade={{ duration: 200 }}
    on:click={close}
    on:keydown={(e) => e.key === 'Escape' && close()}
    role="button"
    tabindex="0"
  ></div>

  <!-- Drawer -->
  <div 
    class="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col"
    transition:fly={{ x: 400, duration: 300, opacity: 1 }}
  >
    <!-- Header -->
    <div class="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900">
      <h2 class="text-xl font-bold text-black dark:text-white flex items-center gap-2">
        <Key size={20} class="text-zinc-500 dark:text-zinc-400" />
        {$t('tutorial.title')}
      </h2>
      <button on:click={close} class="p-1 text-zinc-400 hover:text-black dark:hover:text-white transition-colors">
        <X size={20} />
      </button>
    </div>
    
    <!-- Content -->
    <div class="p-6 overflow-y-auto flex-1 text-black dark:text-white space-y-6">
      
      <div class="space-y-6 relative before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-zinc-200 dark:before:bg-zinc-800 before:z-0">
        <!-- Step 1 -->
        <div class="relative z-10 flex gap-4">
          <div class="w-6 h-6 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-xs font-bold shrink-0">1</div>
          <div class="pt-0.5">
            <p>{$t('tutorial.step1')}</p>
            <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 mt-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
              aistudio.google.com <ExternalLink size={14} />
            </a>
          </div>
        </div>

        <!-- Step 2 -->
        <div class="relative z-10 flex gap-4">
          <div class="w-6 h-6 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-xs font-bold shrink-0">2</div>
          <div class="pt-0.5">
            <p>{$t('tutorial.step2')}</p>
          </div>
        </div>

        <!-- Step 3 -->
        <div class="relative z-10 flex gap-4">
          <div class="w-6 h-6 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-xs font-bold shrink-0">3</div>
          <div class="pt-0.5">
            <p>{$t('tutorial.step3')}</p>
          </div>
        </div>

        <!-- Step 4 -->
        <div class="relative z-10 flex gap-4">
          <div class="w-6 h-6 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-xs font-bold shrink-0">4</div>
          <div class="pt-0.5">
            <p>{$t('tutorial.step4')}</p>
          </div>
        </div>
        
        <!-- Step 5 -->
        <div class="relative z-10 flex gap-4">
          <div class="w-6 h-6 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-xs font-bold shrink-0">5</div>
          <div class="pt-0.5">
            <p>{$t('tutorial.step5')}</p>
          </div>
        </div>

        <!-- Step 6 -->
        <div class="relative z-10 flex gap-4">
          <div class="w-6 h-6 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-xs font-bold shrink-0">
            <CheckCircle size={14} />
          </div>
          <div class="pt-0.5">
            <p>{$t('tutorial.step6')}</p>
          </div>
        </div>
      </div>

    </div>
    
    <!-- Footer -->
    <div class="px-6 py-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex justify-end mt-auto">
      <button on:click={close} class="px-6 py-2 bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors">
        {$t('tutorial.close')}
      </button>
    </div>
  </div>
{/if}
