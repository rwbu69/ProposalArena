<script lang="ts">
  import { onMount } from "svelte";
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
  import { DEFAULT_SERVER_PROXY_MODEL, loadSettings } from "../../lib/storage/settings";
  import { v4 as uuidv4 } from "uuid";
  import { t } from "svelte-i18n";
  import { showSettings } from "../../lib/state/stores";
  import Icon from "../common/Icon.svelte";

  let dragOver = false;
  let file: File | null = null;
  let errorStr = "";
  let fileInput: HTMLInputElement;
  let processingStage: "" | "reading" | "saving" | "analyzing" = "";
  let extractedText = "";
  let extractedFileData: ArrayBuffer | undefined;
  let detectedLanguage: "en" | "id" = "en";
  let showLanguageConfirmation = false;

  const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

  function errorMessage(error: unknown) {
    const raw = error instanceof Error ? error.message : $t("upload.errorUnknown");
    const lower = raw.toLowerCase();
    if (lower.includes('dynamically imported module') || lower.includes('failed to fetch dynamically')) {
      return 'Modul sistem peramban sempat memuat ulang. Silakan pilih atau unggah kembali berkas proposalmu.';
    }
    if (lower.includes('gemini_api_key') || lower.includes('api key belum')) {
      return 'Gemini API Key belum terkonfigurasi. Silakan klik tombol "Buka Settings" di bawah untuk memasukkan API Key.';
    }
    if (lower.includes('503') || lower.includes('overloaded') || lower.includes('429')) {
      return 'Layanan Google Gemini sedang padat. Silakan coba kembali dalam beberapa detik.';
    }
    if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('unable to reach')) {
      return 'Koneksi ke server AI terputus. Pastikan koneksi internet stabil dan coba kembali.';
    }
    return raw;
  }

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
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      errorStr = $t("upload.errorPdfOnly");
      return;
    }
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      errorStr = $t("upload.errorFileTooLarge");
      return;
    }
    file = selectedFile;
    processFile();
  }

  async function processFile() {
    if (!file) return;
    $isProcessing = true;
    errorStr = "";
    try {
      processingStage = "reading";
      extractedText = await extractTextFromFile(file);
      detectedLanguage = detectLanguage(extractedText);
      if (file.name.toLowerCase().endsWith(".pdf")) {
        extractedFileData = await file.arrayBuffer();
      }
      showLanguageConfirmation = true;
      processingStage = "";
      $isProcessing = false;
    } catch (e: unknown) {
      errorStr = errorMessage(e);
      processingStage = "";
      $isProcessing = false;
    }
  }

  async function continueWithLanguage(language: "en" | "id") {
    if (!file || !extractedText) return;
    detectedLanguage = language;
    showLanguageConfirmation = false;
    $isProcessing = true;
    errorStr = "";
    try {
      processingStage = "saving";
      const proposal = {
        id: uuidv4(),
        title: file.name,
        text: extractedText,
        fileData: extractedFileData,
        language,
        uploadedAt: Date.now(),
      };
      await dbStore.saveProposal(proposal);

      const settings = loadSettings();
      const proxyUrl = import.meta.env.PUBLIC_AI_PROXY_URL || settings?.proxyUrl;
      const usesServerProxy = proxyUrl?.startsWith('/');
      if (!usesServerProxy && (!settings?.apiKey || settings.apiKey.trim().length < 5)) {
        showSettings.set(true);
        throw new Error($t("upload.errorNoApiKey"));
      }

      const provider = createAIProvider({
        providerId: "gemini",
        apiKey: settings?.apiKey,
        model: usesServerProxy ? DEFAULT_SERVER_PROXY_MODEL : (settings?.model || "gemini-3.5-flash-lite"),
        proxyUrl: proxyUrl || "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      });

      processingStage = "analyzing";
      const analysis = await analyzeProposal(provider, extractedText, language);
      analysis.id = proposal.id;
      analysis.analyzedAt = Date.now();
      await dbStore.saveAnalysis(analysis);

      $currentAnalysis = analysis;
      await initSession(proposal.id);

      try {
        const { globalIndexer } = await import("../../lib/search/indexer");
        globalIndexer.indexProposal(proposal.id, extractedText);
      } catch (indexErr) {
        console.warn("Failed to index proposal on upload:", indexErr);
      }
    } catch (e: unknown) {
      errorStr = errorMessage(e);
    } finally {
      processingStage = "";
      $isProcessing = false;
    }
  }
</script>

<div
  class="w-full h-full bg-paper-surface dark:bg-paper-surface-dark flex flex-col items-center justify-center p-8 sm:p-14 lg:p-20 relative select-none transition-colors duration-150 {dragOver
    ? 'bg-paper dark:bg-paper-dark'
    : ''}"
  on:dragover|preventDefault={() => (dragOver = true)}
  on:dragleave={() => (dragOver = false)}
  on:drop={handleDrop}
>
  <!-- Drop Frame -->
  <div
    class="w-full max-w-lg rounded-2xl border-2 border-dashed border-hairline dark:border-hairline-dark p-8 sm:p-12 lg:p-14 flex flex-col items-start justify-center transition-all duration-200 {dragOver
      ? 'border-accent dark:border-accent-dark bg-paper dark:bg-paper-dark shadow-xl scale-[1.01]'
      : 'hover:border-ink-muted/50 dark:hover:border-ink-muted-dark/50 bg-paper/60 dark:bg-paper-dark/60 shadow-xs'}"
  >
    {#if showLanguageConfirmation}
      <div class="space-y-5 w-full">
        <div class="space-y-1.5">
          <span class="text-xs font-sans font-medium text-accent dark:text-accent-dark">
            {$t("upload.languageLabel")}
          </span>
          <h2 class="font-sans text-xl font-semibold text-ink dark:text-ink-dark tracking-tight">
            {$t("upload.languageTitle")}
          </h2>
          <p class="text-sm text-ink-muted dark:text-ink-muted-dark leading-relaxed font-sans">
            {$t("upload.languageDescription")}
          </p>
        </div>
        <div class="border-y border-hairline/80 dark:border-hairline-dark/80 py-3 flex items-center justify-between">
          <span class="text-sm font-medium text-ink dark:text-ink-dark font-sans">
            {detectedLanguage === "id" ? "Bahasa Indonesia" : "English"}
          </span>
          <span class="text-[11px] font-sans text-ink-faint dark:text-ink-faint-dark px-2 py-0.5 rounded-full bg-hairline/50 dark:bg-hairline-dark/50">
            {$t("upload.languageDetected")}
          </span>
        </div>
        <div class="grid grid-cols-2 gap-2.5">
          <button type="button" on:click={() => (detectedLanguage = "en")} class="px-3.5 py-2.5 border text-left text-xs font-sans font-medium rounded-lg transition-colors {detectedLanguage === 'en' ? 'border-accent bg-accent/10 dark:bg-accent-dark/15 text-ink dark:text-ink-dark' : 'border-hairline dark:border-hairline-dark text-ink-muted dark:text-ink-muted-dark hover:border-ink-muted'}">
            English
          </button>
          <button type="button" on:click={() => (detectedLanguage = "id")} class="px-3.5 py-2.5 border text-left text-xs font-sans font-medium rounded-lg transition-colors {detectedLanguage === 'id' ? 'border-accent bg-accent/10 dark:bg-accent-dark/15 text-ink dark:text-ink-dark' : 'border-hairline dark:border-hairline-dark text-ink-muted dark:text-ink-muted-dark hover:border-ink-muted'}">
            Bahasa Indonesia
          </button>
        </div>
        <div class="pt-1">
          <button type="button" on:click={() => continueWithLanguage(detectedLanguage)} class="px-5 py-2.5 bg-ink hover:bg-ink/90 dark:bg-ink-dark dark:hover:bg-ink-dark/90 text-paper dark:text-paper-dark text-xs font-sans font-medium rounded-lg transition-all shadow-sm">
            {$t("upload.languageContinue")}
          </button>
        </div>
      </div>
    {:else if $isProcessing}
      <!-- QUIET PROCESSING STATE -->
      <div class="space-y-4 w-full">
        <div class="flex items-center gap-3">
          <Icon name="loader" size={18} class="animate-spin text-accent dark:text-accent-dark shrink-0" />
          <span class="font-sans text-lg font-medium text-ink dark:text-ink-dark">
            {processingStage === "reading"
              ? $t("upload.stageReading")
              : processingStage === "analyzing"
                ? $t("upload.stageAnalyzing")
                : processingStage === "saving"
                  ? $t("upload.stageSaving")
                  : $t("upload.readingDoc")}
          </span>
        </div>
        <p class="text-xs font-sans text-ink-muted dark:text-ink-muted-dark leading-relaxed">
          {$t("upload.processingHint")}
        </p>
        <div class="flex items-center gap-2 pt-2 text-xs font-sans text-ink-faint dark:text-ink-faint-dark">
          <span class={processingStage === "reading" ? "text-accent dark:text-accent-dark font-medium" : ""}>{$t("upload.stageReading")}</span>
          <span>·</span>
          <span class={processingStage === "analyzing" ? "text-accent dark:text-accent-dark font-medium" : ""}>{$t("upload.stageAnalyzing")}</span>
          <span>·</span>
          <span class={processingStage === "saving" ? "text-accent dark:text-accent-dark font-medium" : ""}>{$t("upload.stageSaving")}</span>
        </div>
      </div>
    {:else}
      <!-- RESTING / DRAG STATE -->
      <div class="space-y-5 w-full text-left">
        <div class="w-12 h-12 rounded-xl bg-accent/10 dark:bg-accent-dark/15 text-accent dark:text-accent-dark flex items-center justify-center">
          <Icon name="upload" size={22} />
        </div>

        <div class="space-y-1.5">
          <h2 class="font-sans text-xl sm:text-2xl font-semibold text-ink dark:text-ink-dark tracking-tight">
            {dragOver ? $t("upload.dropPrompt") : $t("upload.title")}
          </h2>

          <p class="text-sm text-ink-muted dark:text-ink-muted-dark leading-relaxed font-sans max-w-md">
            {$t("upload.description")}
          </p>
        </div>

        <div class="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
          <button
            type="button"
            on:click|stopPropagation={() => fileInput.click()}
            class="inline-flex items-center gap-2 px-5 py-2.5 bg-ink hover:bg-ink/90 dark:bg-ink-dark dark:hover:bg-ink-dark/90 text-paper dark:text-paper-dark text-sm font-medium transition-all cursor-pointer rounded-lg shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ink dark:focus-visible:ring-ink-dark"
            aria-label={$t("upload.selectFileAria")}
          >
            <Icon name="upload" size={15} />
            <span>{$t("upload.selectFile")}</span>
          </button>
          
          <span class="text-xs font-sans text-ink-faint dark:text-ink-faint-dark">
            {$t("upload.fileLimit")}
          </span>
        </div>
      </div>
    {/if}

    <!-- ERROR NOTICE -->
    {#if errorStr}
      <div
        class="mt-6 pt-4 border-t border-hairline dark:border-hairline-dark w-full space-y-3"
      >
        <div class="flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400 font-sans leading-relaxed p-3.5 rounded-xl bg-red-500/10 border border-red-500/20">
          <Icon name="alert-triangle" size={16} class="shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          <p class="m-0 break-words flex-1">
            {errorStr}
          </p>
        </div>
        <div class="pt-1">
          <button
            type="button"
            on:click|stopPropagation={() => showSettings.set(true)}
            class="inline-flex items-center gap-2 px-4 py-2.5 bg-ink hover:bg-ink/90 dark:bg-ink-dark dark:hover:bg-ink-dark/90 text-paper dark:text-paper-dark text-xs font-sans font-medium rounded-lg shadow-sm transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ink dark:focus-visible:ring-ink-dark"
          >
            <Icon name="settings" size={14} />
            <span>{$t("tutorial.openSettings")}</span>
          </button>
        </div>
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
