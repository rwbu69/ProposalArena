<script lang="ts">
  import { extractTextFromFile, detectLanguage } from '../../lib/file/extractor';
  import { dbStore } from '../../lib/db/database';
  import { initSession, currentAnalysis, isProcessing } from '../../lib/interview/controller';
  import { analyzeProposal } from '../../lib/ai/pipeline';
  import { createAIProvider } from '../../lib/ai/provider';
  import { loadSettings } from '../../lib/storage/settings';
  import { v4 as uuidv4 } from 'uuid';

  let dragOver = false;
  let file: File | null = null;
  let errorStr = '';

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragOver = false;
    if (e.dataTransfer?.files.length) {
      file = e.dataTransfer.files[0] || null;
    }
  }

  function handleFileChange(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.files?.length) {
      file = target.files[0] || null;
    }
  }

  async function processFile() {
    if (!file) return;
    $isProcessing = true;
    errorStr = '';
    try {
      const text = await extractTextFromFile(file);
      const language = detectLanguage(text);
      
      let fileData: ArrayBuffer | undefined = undefined;
      if (file.name.toLowerCase().endsWith('.pdf')) {
        fileData = await file.arrayBuffer();
      }
      
      const proposal = {
        id: uuidv4(),
        title: file.name,
        text,
        fileData,
        language,
        uploadedAt: Date.now()
      };
      
      await dbStore.saveProposal(proposal);
      
      // Attempt analysis
      const settings = loadSettings();
      if (!settings?.apiKey) {
        throw new Error("Please configure your API key in Settings first. You can add it later.");
      }
      
      const provider = createAIProvider({
        providerId: settings.providerId || 'openrouter',
        apiKey: settings.apiKey,
        model: settings.model || 'nvidia/nemotron-3-ultra-550b-a55b:free, nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free, nvidia/nemotron-3.5-lightning:free, nvidia/nemotron-3-super-120b-a12b:free, thinkingmachines/inkling:free, poolside/laguna-s-2.1:free'
      });
      
      const analysis = await analyzeProposal(provider, text, language);
      analysis.id = proposal.id;
      analysis.analyzedAt = Date.now();
      await dbStore.saveAnalysis(analysis);
      
      $currentAnalysis = analysis;
      await initSession(proposal.id);
      
      const { globalIndexer } = await import('../../lib/search/indexer');
      globalIndexer.indexProposal(proposal.id, text);
    } catch (e: any) {
      errorStr = e.message;
    } finally {
      $isProcessing = false;
    }
  }
</script>

<div class="max-w-xl mx-auto p-8 border-2 border-dashed rounded-xl mt-12 bg-white" 
     role="presentation"
     class:border-blue-500={dragOver}
     on:dragover|preventDefault={() => dragOver = true}
     on:dragleave={() => dragOver = false}
     on:drop={handleDrop}>
  
  <h2 class="text-2xl font-bold mb-4 text-slate-800">Upload Proposal</h2>
  <p class="text-slate-600 mb-6">Drag and drop your PDF or TXT file here, or click to select.</p>
  
  <input type="file" accept=".pdf,.txt" class="block w-full mb-4 text-slate-700" on:change={handleFileChange} />
  
  {#if file}
    <p class="mb-4 font-medium text-slate-700">Selected: {file.name}</p>
    <button 
      on:click={processFile}
      disabled={$isProcessing}
      class="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 disabled:opacity-50">
      {$isProcessing ? 'Processing...' : 'Start Defense Simulator'}
    </button>
  {/if}

  {#if errorStr}
    <p class="mt-4 text-red-500">{errorStr}</p>
  {/if}
</div>
