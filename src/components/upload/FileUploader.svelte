<script lang="ts">
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
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
  let showPrivacyDetails = false;
  let providerName = "Google Gemini";
  let processingStage: "" | "reading" | "saving" | "analyzing" = "";
  let extractedText = "";
  let extractedFileData: ArrayBuffer | undefined;
  let detectedLanguage: "en" | "id" = "en";
  let showLanguageConfirmation = false;

  function errorMessage(error: unknown) {
    return error instanceof Error ? error.message : $t("upload.errorUnknown");
  }

  function updateProviderName() {
    const s = loadSettings();
    if (s?.providerId === "openrouter") providerName = "OpenRouter";
    else if (s?.providerId === "openai") providerName = "OpenAI";
    else providerName = "Google Gemini";
  }

  onMount(() => {
    updateProviderName();
  });

  $: if (!$showSettings) {
    updateProviderName();
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
    if (validTypes.includes(selectedFile.type) || selectedFile.name.toLowerCase().endsWith('.pdf')) {
      file = selectedFile;
      processFile();
    } else {
      errorStr = $t("upload.errorPdfOnly");
    }
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
        $showSettings = true;
        throw new Error($t("upload.errorNoApiKey"));
      }

      const provider = createAIProvider({
        providerId: usesServerProxy ? "openrouter" : (settings.providerId || "gemini"),
        apiKey: settings?.apiKey,
        model: usesServerProxy ? DEFAULT_SERVER_PROXY_MODEL : (settings.model || "gemini-3.5-flash-lite"),
        proxyUrl: proxyUrl || "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      });

      processingStage = "analyzing";
      const analysis = await analyzeProposal(provider, extractedText, language);
      analysis.id = proposal.id;
      analysis.analyzedAt = Date.now();
      await dbStore.saveAnalysis(analysis);

      $currentAnalysis = analysis;
      await initSession(proposal.id);

      const { globalIndexer } = await import("../../lib/search/indexer");
      globalIndexer.indexProposal(proposal.id, extractedText);
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
    {#if showLanguageConfirmation}
      <div class="space-y-5 w-full" on:click|stopPropagation>
        <div class="space-y-2">
          <span class="text-[10px] font-mono uppercase tracking-widest text-ink-faint dark:text-ink-faint-dark">
            {$t("upload.languageLabel")}
          </span>
          <h2 class="font-serif text-2xl text-ink dark:text-ink-dark">
            {$t("upload.languageTitle")}
          </h2>
          <p class="text-sm text-ink-muted dark:text-ink-muted-dark leading-relaxed">
            {$t("upload.languageDescription")}
          </p>
        </div>
        <div class="border-y border-hairline dark:border-hairline-dark py-3 flex items-center justify-between">
          <span class="text-sm text-ink dark:text-ink-dark">
            {detectedLanguage === "id" ? "Bahasa Indonesia" : "English"}
          </span>
          <span class="text-[10px] font-mono uppercase tracking-widest text-ink-faint dark:text-ink-faint-dark">
            {$t("upload.languageDetected")}
          </span>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <button type="button" on:click={() => (detectedLanguage = "en")} class="px-3 py-2 border text-left text-xs font-mono rounded-xs {detectedLanguage === 'en' ? 'border-accent bg-accent/10 text-ink dark:text-ink-dark' : 'border-hairline dark:border-hairline-dark text-ink-muted dark:text-ink-muted-dark'}">
            English
          </button>
          <button type="button" on:click={() => (detectedLanguage = "id")} class="px-3 py-2 border text-left text-xs font-mono rounded-xs {detectedLanguage === 'id' ? 'border-accent bg-accent/10 text-ink dark:text-ink-dark' : 'border-hairline dark:border-hairline-dark text-ink-muted dark:text-ink-muted-dark'}">
            Bahasa Indonesia
          </button>
        </div>
        <div class="flex flex-wrap gap-2">
          <button type="button" on:click={() => continueWithLanguage(detectedLanguage)} class="px-4 py-2 bg-accent hover:bg-accent-hover dark:bg-accent-dark dark:hover:bg-accent-dark-hover text-paper dark:text-paper-dark text-xs font-mono rounded-xs">
            {$t("upload.languageContinue")}
          </button>
        </div>
      </div>
    {:else if $isProcessing}
      <!-- QUIET PROCESSING STATE -->
      <div class="space-y-3 w-full">
        <div class="flex items-center gap-2.5">
          <span class="inline-block w-2 h-2 rounded-full bg-accent dark:bg-accent-dark animate-pulse"></span>
          <span class="font-serif text-lg text-ink dark:text-ink-dark font-normal">
            {processingStage === "reading"
              ? $t("upload.stageReading")
              : processingStage === "analyzing"
                ? $t("upload.stageAnalyzing")
                : processingStage === "saving"
                  ? $t("upload.stageSaving")
                  : $t("upload.readingDoc")}
          </span>
        </div>
        <p class="text-xs font-mono text-ink-muted dark:text-ink-muted-dark">
          {$t("upload.processingHint")}
        </p>
        <div class="flex gap-2 pt-2 text-[10px] font-mono uppercase tracking-wider text-ink-faint dark:text-ink-faint-dark">
          <span class={processingStage === "reading" ? "text-accent dark:text-accent-dark" : ""}>{$t("upload.stageReading")}</span>
          <span>·</span>
          <span class={processingStage === "analyzing" ? "text-accent dark:text-accent-dark" : ""}>{$t("upload.stageAnalyzing")}</span>
          <span>·</span>
          <span class={processingStage === "saving" ? "text-accent dark:text-accent-dark" : ""}>{$t("upload.stageSaving")}</span>
        </div>
      </div>
    {:else}
      <!-- RESTING / DRAG STATE -->
      <div class="space-y-4 w-full text-left">
        <div class="text-[11px] font-mono uppercase tracking-widest text-ink-faint dark:text-ink-faint-dark">
          {$t("upload.sectionLabel")}
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
            on:click|stopPropagation={() => fileInput.click()}
            class="inline-flex items-center gap-2.5 px-5 py-2.5 bg-accent hover:bg-accent-hover dark:bg-accent-dark dark:hover:bg-accent-dark-hover text-paper dark:text-paper-dark text-xs font-mono tracking-wider transition-colors cursor-pointer rounded-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:focus-visible:ring-accent-dark focus-visible:ring-offset-2 focus-visible:ring-offset-paper-surface dark:focus-visible:ring-offset-paper-surface-dark"
            aria-label={$t("upload.selectFileAria")}
          >
            <Icon name="upload" size={16} />
            <span>{$t("upload.selectFile")}</span>
          </button>
          <span class="text-xs font-mono text-ink-faint dark:text-ink-faint-dark">
            {$t("upload.fileLimit")}
          </span>
        </div>

        <!-- Privacy Note: One quiet sentence directly beneath upload action with inline Detail toggle -->
        <div
          class="pt-3 text-xs text-ink-muted dark:text-ink-muted-dark leading-relaxed font-sans max-w-md"
          on:click|stopPropagation
        >
          <span>{$t("landing.privacyNote", { values: { provider: providerName } })}</span>
          {' '}
          <button
            type="button"
            class="underline underline-offset-2 text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark transition-colors inline cursor-pointer p-0.5 rounded-xs focus:outline-none focus-visible:ring-1 focus-visible:ring-ink dark:focus-visible:ring-ink-dark"
            aria-expanded={showPrivacyDetails}
            aria-label={$t("landing.privacyDetailAria")}
            on:click={() => (showPrivacyDetails = !showPrivacyDetails)}
          >
            {$t("landing.privacyDetailToggle")}
          </button>

          {#if showPrivacyDetails}
            <div
              transition:fade={{ duration: 150 }}
              class="mt-2 space-y-1 text-ink-faint dark:text-ink-faint-dark text-[11px] leading-normal"
            >
              <p>{$t("landing.privacyDetailStorage")}</p>
              <p>{$t("landing.privacyDetailPolicy", { values: { provider: providerName } })}</p>
            </div>
          {/if}
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
