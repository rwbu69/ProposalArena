<script lang="ts">
  import { submitAnswer, isProcessing, endInterview } from '../../lib/interview/controller';
  import { Send, Flag } from 'lucide-svelte';
  
  let text = '';
  
  async function handleSubmit() {
    if (!text.trim() || $isProcessing) return;
    const answer = text;
    text = '';
    await submitAnswer(answer);
  }
  
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }
</script>

<div class="p-4 bg-white border-t border-slate-200">
  <div class="flex items-end gap-2">
    <button 
      on:click={endInterview}
      disabled={$isProcessing}
      class="p-3 bg-slate-100 text-slate-600 rounded-xl shadow-sm border border-slate-300 hover:bg-slate-200 disabled:opacity-50 flex items-center justify-center flex-shrink-0"
      title="End Defense">
      <Flag size={20} />
    </button>
    <textarea 
      bind:value={text}
      on:keydown={handleKeydown}
      disabled={$isProcessing}
      placeholder={$isProcessing ? 'Waiting for AI...' : 'Type your answer...'}
      class="flex-1 resize-none border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
      rows="2"
    ></textarea>
    
    <button 
      on:click={handleSubmit}
      disabled={!text.trim() || $isProcessing}
      class="p-3 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 flex items-center justify-center">
      <Send size={20} />
    </button>
  </div>
</div>
