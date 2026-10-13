<script lang="ts">
  import {
    extractTextFromFile,
    detectLanguage,
  } from "../../lib/file/extractor";
  import { dbStore } from "../../lib/db/database";
  import {
    initSession,
    currentAnalysis,
    isProcessing,
  } from "../../lib/interview/controller";
  import { analyzeProposal } from "../../lib/ai/pipeline";
  import { createAIProvider } from "../../lib/ai/provider";
  import { loadSettings } from "../../lib/storage/settings";
  import { v4 as uuidv4 } from "uuid";
  import { t } from "svelte-i18n";
  import { showSettings } from "../../lib/state/stores";

  let dragOver = false;
  let file: File | null = null;
  let errorStr = "";
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
    if (validTypes.includes(selectedFile.type) || selectedFile.name.toLowerCase().endsWith('.pdf')) {
      file = selectedFile;
      processFile();
    } else {
      errorStr = "Hanya berkas format PDF yang didukung. Harap unggah proposal dalam format PDF.";
    }
  }

  async function processFile() {
    if (!file) return;
    $isProcessing = true;
    errorStr = "";
    try {
      const text = await extractTextFromFile(file);
      const language = detectLanguage(text);

      let fileData: ArrayBuffer | undefined = undefined;
      if (file.name.toLowerCase().endsWith(".pdf")) {
        fileData = await file.arrayBuffer();
      }

      const proposal = {
        id: uuidv4(),
        title: file.name,
        text,
        fileData,
        language,
        uploadedAt: Date.now(),
      };

      await dbStore.saveProposal(proposal);

      const settings = loadSettings();
      if (!settings?.apiKey || settings.apiKey.trim().length < 5) {
        $showSettings = true;
        throw new Error(
          "API Key belum dikonfigurasi. Harap masukkan API Key Gemini Anda di Pengaturan.",
        );
      }

      const provider = createAIProvider({
        providerId: settings.providerId || "gemini",
        apiKey: settings.apiKey,
        model: settings.model || "gemini-3.5-flash-lite",
        proxyUrl:
          settings.proxyUrl ||
          "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      });

      const analysis = await analyzeProposal(provider, text, language);
      analysis.id = proposal.id;
      analysis.analyzedAt = Date.now();
      await dbStore.saveAnalysis(analysis);

      $currentAnalysis = analysis;
      await initSession(proposal.id);

      const { globalIndexer } = await import("../../lib/search/indexer");
      globalIndexer.indexProposal(proposal.id, text);
    } catch (e: any) {
      errorStr = e.message;
    } finally {
      $isProcessing = false;
    }
  }
</script>

<div
  class="w-full h-full bg-paper-surface dark:bg-paper-surface-dark flex flex-col items-center justify-center p-8 sm:p-14 lg:p-20 relative select-none transition-colors duration-150 {dragOver
    ? 'bg-paper dark:bg-paper-dark'
    : ''}"
  role="button"
  tabindex="0"
  on:dragover|preventDefault={() => (dragOver = true)}
  on:dragleave={() => (dragOver = false)}
  on:drop={handleDrop}
  on:click={() => fileInput.click()}
  on:keydown={(e) => e.key === "Enter" && fileInput.click()}
>
  <!-- Hairline Drop Frame -->
  <div
    class="w-full max-w-lg border border-hairline dark:border-hairline-dark p-10 sm:p-14 flex flex-col items-start justify-center transition-colors duration-150 {dragOver
      ? 'border-ink dark:border-ink-dark bg-paper dark:bg-paper-dark'
      : 'hover:border-ink-muted dark:hover:border-ink-muted-dark'}"
  >
    {#if $isProcessing}
      <!-- QUIET PROCESSING STATE -->
      <div class="space-y-3 w-full">
        <div class="flex items-center gap-2.5">
          <span class="inline-block w-2 h-2 rounded-full bg-accent dark:bg-accent-dark animate-pulse"></span>
          <span class="font-serif text-lg text-ink dark:text-ink-dark font-normal">
            {$t("upload.readingDoc")}
          </span>
        </div>
        <p class="text-xs font-mono text-ink-muted dark:text-ink-muted-dark">
          Memeriksa struktur metodologi dan konteks riset proposal...
        </p>
      </div>
    {:else}
      <!-- RESTING / DRAG STATE -->
      <div class="space-y-4 w-full text-left">
        <div class="text-[11px] font-mono uppercase tracking-widest text-ink-faint dark:text-ink-faint-dark">
          Berkas Proposal
        </div>

        <h2 class="font-serif text-2xl sm:text-3xl font-normal text-ink dark:text-ink-dark tracking-tight leading-snug">
          {dragOver ? $t("upload.dropPrompt") : $t("upload.title")}
        </h2>

        <p class="text-sm text-ink-muted dark:text-ink-muted-dark leading-relaxed font-sans max-w-md">
          {$t("upload.description")}
        </p>

        <div class="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <button
            type="button"
            class="px-5 py-2.5 bg-accent hover:bg-accent-hover text-white text-xs font-mono tracking-wider transition-colors"
          >
            Pilih Berkas PDF
          </button>
          <span class="text-xs font-mono text-ink-faint dark:text-ink-faint-dark">
            Maks. 10 MB • PDF
          </span>
        </div>
      </div>
    {/if}

    <!-- ERROR NOTICE -->
    {#if errorStr}
      <div
        class="mt-6 pt-4 border-t border-hairline dark:border-hairline-dark w-full space-y-2"
        on:click|stopPropagation
      >
        <p class="text-xs text-red-700 dark:text-red-400 font-sans leading-relaxed">
          {errorStr}
        </p>
        <button
          type="button"
          on:click={() => ($showSettings = true)}
          class="font-mono text-xs text-ink dark:text-ink-dark underline underline-offset-4 hover:text-ink-muted"
        >
          {$t("tutorial.openSettings")} →
        </button>
      </div>
    {/if}
  </div>

  <input
    type="file"
    bind:this={fileInput}
    class="hidden"
    accept=".pdf"
    on:change={handleFileChange}
  />
</div>
