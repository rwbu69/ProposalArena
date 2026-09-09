<script lang="ts">
  import { currentMessages } from '../../lib/interview/controller';
  import { afterUpdate } from 'svelte';
  
  let scrollContainer: HTMLDivElement;
  
  afterUpdate(() => {
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  });
</script>

<div class="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50" bind:this={scrollContainer}>
  {#if $currentMessages.length === 0}
    <div class="flex items-center justify-center h-full text-slate-400">
      The defense will start shortly...
    </div>
  {/if}
  
  {#each $currentMessages as msg (msg.id)}
    <div class="flex {msg.role === 'user' ? 'justify-end' : 'justify-start'}">
      <div class="max-w-[80%] rounded-xl p-4 {msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white shadow-sm border border-slate-100 text-slate-800'}">
        <p class="whitespace-pre-wrap">{msg.content}</p>
      </div>
    </div>
  {/each}
</div>
