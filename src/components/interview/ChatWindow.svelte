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
    <div class="flex flex-col items-center justify-center h-full text-slate-800 space-y-6">
      <div class="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center max-w-md">
        <h3 class="text-xl font-bold mb-2">Defense Staging</h3>
        <p class="text-slate-600 mb-6">Are you ready to start your defense? / Apakah kamu siap untuk memulai sidang?</p>
        
        <button 
          on:click={() => {
            import('../../lib/interview/controller').then(m => m.askNextQuestion());
          }}
          class="w-full py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-bold shadow-md transition-all">
          Yes / Ya
        </button>
      </div>
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
