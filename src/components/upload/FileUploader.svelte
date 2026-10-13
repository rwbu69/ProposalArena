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
  import { FileUp } from "lucide-svelte";
  import { showSettings } from "../../lib/state/stores";

  let isHovered = false;
  let dragOver = false;
  let file: File | null = null;
  let errorStr = "";
  let fileInput: HTMLInputElement;

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragOver = false;
    isHovered = false;
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
  class="canvas-dropzone w-full h-full bg-zinc-50 dark:bg-space-right cursor-pointer flex flex-col items-center justify-center relative group {dragOver
    ? 'bg-zinc-200 dark:!bg-space-active'
    : ''}"
  role="button"
  tabindex="0"
  on:mouseenter={() => (isHovered = true)}
  on:mouseleave={() => (isHovered = false)}
  on:dragover|preventDefault={() => {
    dragOver = true;
    isHovered = true;
  }}
  on:dragleave={() => {
    dragOver = false;
    isHovered = false;
  }}
  on:drop={handleDrop}
  on:click={() => fileInput.click()}
  on:keydown={(e) => e.key === "Enter" && fileInput.click()}
>
  <div class="noise-bg"></div>

  <!-- CENTRAL INTERACTION: FLOATING BALLOON + CROSSHAIR -->
  <div class="relative flex flex-col items-center justify-center">
    <!-- FLOATING BALLOON TOOLTIP (POPS UP ON HOVER / DRAG) -->
    <div
      class="absolute bottom-full mb-5 flex flex-col items-center transition-all duration-300 ease-out pointer-events-none z-20 {isHovered ||
      dragOver ||
      $isProcessing
        ? 'opacity-100 -translate-y-2 scale-100'
        : 'opacity-0 translate-y-2 scale-95 group-hover:opacity-100 group-hover:-translate-y-2 group-hover:scale-100'}"
    >
      <div
        class="px-5 py-3 rounded-2xl bg-white/95 dark:bg-[#1e1e1e]/95 text-zinc-900 dark:text-white border border-zinc-200/90 dark:border-space-border shadow-2xl shadow-black/10 dark:shadow-black/70 backdrop-blur-md flex flex-col items-center text-center whitespace-nowrap min-w-[210px]"
      >
        <div
          class="text-xs sm:text-sm font-medium tracking-tight flex items-center gap-2 text-zinc-900 dark:text-space-textHighlight"
        >
          <FileUp
            class="w-4 h-4 text-zinc-500 dark:text-space-textSoft shrink-0"
          />
          <span>
            {#if $isProcessing}
              {$t("upload.readingDoc")}
            {:else if dragOver}
              {$t("upload.dropPrompt")}
            {:else}
              {$t("upload.balloonTitle")}
            {/if}
          </span>
        </div>
        <div
          class="text-[11px] font-mono text-zinc-500 dark:text-space-textMuted mt-1 tracking-wide"
        >
          {$t("upload.balloonSubtitle")}
        </div>
      </div>
      <!-- Triangle Pointer Arrow -->
      <div
        class="w-3 h-3 bg-white/95 dark:bg-[#1e1e1e]/95 border-r border-b border-zinc-200/90 dark:border-space-border rotate-45 -mt-1.5 shadow-sm"
      ></div>
    </div>

    <!-- CROSSHAIR -->
    {#if $isProcessing}
      <div
        class="crosshair text-black dark:text-space-textHighlight flex items-center justify-center w-16 h-16 rounded-full border border-black dark:border-space-textSoft opacity-100 scale-125"
      >
        <svg
          class="animate-spin"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg
        >
      </div>
    {:else}
      <div
        class="crosshair {isHovered
          ? 'is-hovered'
          : ''} text-zinc-400 dark:text-space-textMuted flex items-center justify-center w-16 h-16 rounded-full border border-zinc-200 dark:border-[#333] group-hover:border-black dark:group-hover:border-space-textSoft group-hover:text-black dark:group-hover:text-space-textHighlight"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </div>
    {/if}

    <!-- ERROR MESSAGE -->
    {#if errorStr}
      <div
        class="absolute top-full mt-4 px-4 py-2.5 rounded-xl bg-red-50/95 dark:bg-red-950/90 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-mono tracking-wide max-w-sm text-center shadow-xl backdrop-blur-md z-30 flex flex-col items-center gap-2"
      >
        <span>{errorStr}</span>
        <button
          type="button"
          on:click|stopPropagation={() => ($showSettings = true)}
          class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-sans font-medium transition-colors pointer-events-auto"
        >
          Buka Pengaturan
        </button>
      </div>
    {/if}
  </div>

  <!-- SUBTLE IDLE HINT AT BOTTOM (FADES OUT ON HOVER TO AVOID CLUTTER) -->
  <div
    class="absolute bottom-8 lg:bottom-12 left-0 w-full text-center px-6 pointer-events-none transition-opacity duration-300 {isHovered
      ? 'opacity-0'
      : 'group-hover:opacity-0'}"
  >
    <p
      class="text-zinc-500 dark:text-space-textMuted text-xs sm:text-sm tracking-wide"
    >
      {$t("upload.title")}
    </p>
    <p class="text-zinc-400 dark:text-[#555] text-[11px] font-mono mt-1">
      PDF (Maks 10MB)
    </p>
  </div>

  <input
    type="file"
    bind:this={fileInput}
    class="hidden"
    accept=".pdf"
    on:change={handleFileChange}
  />
</div>

<style>
  .canvas-dropzone {
    transition:
      background-color 0.4s ease,
      border-color 0.4s ease;
  }
  .crosshair {
    transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .canvas-dropzone:hover .crosshair,
  .crosshair.is-hovered {
    transform: scale(1.3) rotate(90deg);
  }
</style>
