<script lang="ts">
  import { extractTextFromFile, detectLanguage } from '../../lib/file/extractor';
  import { dbStore } from '../../lib/db/database';
  import { initSession, currentAnalysis, isProcessing } from '../../lib/interview/controller';
  import { analyzeProposal } from '../../lib/ai/pipeline';
  import { createAIProvider } from '../../lib/ai/provider';
  import { loadSettings } from '../../lib/storage/settings';
  import { v4 as uuidv4 } from 'uuid';
  import { t } from 'svelte-i18n';
  
  let dragOver = false;
  let file: File | null = null;
  let errorStr = '';
  let fileInput: HTMLInputElement;

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragOver = false;
    if (e.dataTransfer?.files?.length) {
      const selected = e.dataTransfer.files[0];
      if (selected) handleFiles(selected);
    }
  }

  function handleFileChange(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.files?.length) {
      const selected = target.files[0];
      if (selected) handleFiles(selected);
    }
  }

  function handleFiles(selectedFile: File) {
    const validTypes = ["application/pdf"];
    if (validTypes.includes(selectedFile.type)) {
      file = selectedFile;
      processFile();
    } else {
      errorStr = "Format file tidak didukung. Harap unggah PDF.";
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
      
      const settings = loadSettings();
      if (!settings?.apiKey) {
        throw new Error("API Key belum dikonfigurasi. Harap isi di Pengaturan (ikon gerigi).");
      }
      
      const provider = createAIProvider({
        providerId: settings.providerId || 'gemini',
        apiKey: settings.apiKey,
        model: settings.model || 'gemini-3.5-flash-lite',
        proxyUrl: settings.proxyUrl || 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
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

<style>
  .canvas-dropzone {
    transition: background-color 0.4s ease, border-color 0.4s ease;
  }
  /* In light mode dragover, use a different color but tailwind takes care of bg via utilities mostly. We'll use classes instead. */
  .crosshair {
    transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .canvas-dropzone:hover .crosshair {
    transform: scale(1.5) rotate(90deg);
  }
</style>

<div class="canvas-dropzone w-full h-full bg-zinc-50 dark:bg-space-right cursor-pointer flex flex-col items-center justify-center relative group {dragOver ? 'bg-zinc-200 dark:!bg-space-active' : ''}"
     role="button"
     tabindex="0"
     on:dragover|preventDefault={() => dragOver = true}
     on:dragleave={() => dragOver = false}
     on:drop={handleDrop}
     on:click={() => fileInput.click()}
     on:keydown={(e) => e.key === 'Enter' && fileInput.click()}>
  
  <div class="noise-bg"></div>

  {#if $isProcessing}
    <div class="crosshair text-black dark:text-space-textHighlight flex items-center justify-center w-16 h-16 rounded-full border border-black dark:border-space-textSoft opacity-100 scale-125">
      <svg class="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
    </div>
  {:else}
    <div class="crosshair text-zinc-400 dark:text-space-textMuted flex items-center justify-center w-16 h-16 rounded-full border border-zinc-200 dark:border-[#333] group-hover:border-black dark:group-hover:border-space-textSoft group-hover:text-black dark:group-hover:text-space-textHighlight">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    </div>
  {/if}

  <div class="absolute bottom-8 lg:bottom-12 left-0 w-full text-center px-6 pointer-events-none">
    {#if errorStr}
      <p class="text-red-500 dark:text-red-400 text-sm tracking-wide mb-2 max-w-lg mx-auto">{errorStr}</p>
    {/if}
    <p class="text-zinc-500 dark:text-space-textMuted text-sm tracking-wide group-hover:text-black dark:group-hover:text-space-textHighlight transition-colors duration-300">
      {#if $isProcessing}
        Membaca {file?.name || 'dokumen'}...
      {:else if dragOver}
        Lepaskan file sekarang...
      {:else}
        {$t('upload.title')}
      {/if}
    </p>
    <p class="text-zinc-400 dark:text-[#555] text-xs mt-2 font-medium">PDF (Maks 10MB)</p>
  </div>

  <input type="file" bind:this={fileInput} class="hidden" accept=".pdf" on:change={handleFileChange} />
</div>
