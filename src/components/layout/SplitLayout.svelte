<script lang="ts">
  import ChatWindow from '../interview/ChatWindow.svelte';
  import Controls from '../interview/Controls.svelte';
  import IntegrityMonitor from '../interview/IntegrityMonitor.svelte';
  import { currentProposal, currentSession } from '../../lib/interview/controller';
  import { onDestroy } from 'svelte';
  
  let pdfUrl = '';
  $: if ($currentProposal?.fileData) {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    const blob = new Blob([$currentProposal.fileData], { type: 'application/pdf' });
    pdfUrl = URL.createObjectURL(blob);
  }
  
  onDestroy(() => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
  });
</script>

<IntegrityMonitor />

<div class="flex h-screen w-full bg-slate-100 overflow-hidden">
  <!-- Left Panel: Proposal Viewer -->
  <div class="w-1/2 h-full border-r border-slate-200 bg-white flex flex-col">
    <div class="p-4 border-b border-slate-200 bg-slate-50">
      <h2 class="font-bold text-lg text-slate-800">Proposal Document</h2>
      <p class="text-sm text-slate-500 truncate">
        {$currentProposal?.title || 'Unknown Title'}
      </p>
    </div>
    <div class="flex-1 overflow-hidden bg-slate-200">
      {#if pdfUrl}
        <embed src={pdfUrl} type="application/pdf" class="w-full h-full" />
      {:else}
        <div class="overflow-y-auto p-6 h-full bg-white">
          <div class="prose max-w-none text-slate-700 whitespace-pre-wrap font-serif">
            {$currentProposal?.text || 'No text available.'}
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Right Panel: Interview Engine -->
  <div class="w-1/2 h-full flex flex-col">
    <div class="p-4 border-b border-slate-200 bg-white flex justify-between items-center">
      <div>
        <h2 class="font-bold text-lg text-slate-800">Defense Interview</h2>
        <p class="text-sm text-slate-500">
          Status: <span class="uppercase tracking-wider font-semibold text-blue-600">{$currentSession?.state || 'Unknown'}</span>
        </p>
      </div>
    </div>
    
    <ChatWindow />
    <Controls />
  </div>
</div>
