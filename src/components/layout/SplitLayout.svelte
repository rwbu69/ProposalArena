<script lang="ts">
  import ChatWindow from '../interview/ChatWindow.svelte';
  import Controls from '../interview/Controls.svelte';
  import ReportViewer from '../interview/ReportViewer.svelte';
  import { currentProposal, currentSession } from '../../lib/interview/controller';
</script>

<div class="flex h-screen w-full bg-slate-100 overflow-hidden">
  <!-- Left Panel: Proposal Viewer -->
  <div class="w-1/2 h-full border-r border-slate-200 bg-white flex flex-col">
    <div class="p-4 border-b border-slate-200 bg-slate-50">
      <h2 class="font-bold text-lg text-slate-800">Proposal Document</h2>
      <p class="text-sm text-slate-500 truncate">
        {$currentProposal?.title || 'Unknown Title'}
      </p>
    </div>
    <div class="flex-1 overflow-y-auto p-6">
      <div class="prose max-w-none text-slate-700 whitespace-pre-wrap font-serif">
        {$currentProposal?.text || 'No text available.'}
      </div>
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
    
    {#if $currentSession?.state === 'REPORT_GENERATION' || $currentSession?.state === 'REPORT_READY'}
      <ReportViewer />
    {:else}
      <ChatWindow />
      <Controls />
    {/if}
  </div>
</div>
