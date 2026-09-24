<script lang="ts">
  import { currentMessages } from '../../lib/interview/controller';
  import { afterUpdate } from 'svelte';
  import { t } from 'svelte-i18n';
  import { marked } from 'marked';
  
  let scrollContainer: HTMLDivElement;
  
  afterUpdate(() => {
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  });

  // Safe markdown parsing (since content is from our LLM)
  function parseMarkdown(text: string) {
    return marked.parse(text);
  }
</script>

<div class="absolute inset-0 overflow-y-auto p-4 lg:p-8 space-y-6 bg-transparent" bind:this={scrollContainer}>
  {#if $currentMessages.length === 0}
    <div class="flex-1 flex flex-col items-center justify-center h-full z-10 px-8 text-center transition-all duration-400 ease-out">
      <h3 class="text-3xl md:text-4xl font-medium text-black dark:text-space-textHighlight mb-3 tracking-tight">
        {$t('interview.stagingTitle')}
      </h3>
      <p class="text-zinc-500 dark:text-space-textMuted text-base md:text-lg font-light mb-10 max-w-sm leading-relaxed">
        {$t('interview.stagingSubtitle')}
      </p>

      <button 
        on:click={() => {
          import('../../lib/interview/controller').then(m => m.askNextQuestion());
        }}
        class="group relative px-8 py-3 rounded-full border border-zinc-300 dark:border-[#333] hover:border-black dark:hover:border-space-textSoft transition-all duration-300 text-black dark:text-space-textHighlight overflow-hidden">
        <span class="relative z-10 text-sm tracking-wide group-hover:text-white dark:group-hover:text-white transition-colors">
          {$t('interview.yes')}
        </span>
        <div class="absolute inset-0 bg-black dark:bg-[#222] scale-y-0 group-hover:scale-y-100 origin-bottom transition-transform duration-300 ease-out"></div>
      </button>
    </div>
  {/if}
  
  {#each $currentMessages as msg (msg.id)}
    <div class="flex {msg.role === 'user' ? 'justify-end' : 'justify-start'}">
      <div class="max-w-[85%] p-5 border {msg.role === 'user' ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white' : 'bg-white dark:bg-space-right border-zinc-200 dark:border-space-border text-black dark:text-space-textHighlight shadow-sm dark:shadow-none'}">
        <div class="prose prose-sm md:prose-base dark:prose-invert max-w-none break-words {msg.role === 'user' ? 'prose-p:text-white dark:prose-p:text-black' : ''}">
          {@html parseMarkdown(msg.content)}
        </div>
      </div>
    </div>
  {/each}
</div>
