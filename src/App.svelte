<script lang="ts">
  import './i18n/index'; // Initialize i18n first
  import { onMount } from 'svelte';
  import { currentSession } from './lib/interview/controller';
  import { uiLanguage, showSettings } from './lib/state/stores';
  import { initTheme } from './lib/state/theme';
  import FileUploader from './components/upload/FileUploader.svelte';
  import SplitLayout from './components/layout/SplitLayout.svelte';
  import SettingsModal from './components/layout/SettingsModal.svelte';
  import ApiKeyGuide from './components/layout/ApiKeyGuide.svelte';
  import { t, isLoading } from 'svelte-i18n';

  onMount(() => {
    return initTheme();
  });

  function toggleLanguage() {
    const currentLang = uiLanguage.get();
    uiLanguage.set(currentLang === 'en' ? 'id' : 'en');
  }
</script>

{#if $isLoading}
  <div class="min-h-screen bg-paper dark:bg-paper-dark flex items-center justify-center font-mono text-xs text-ink-muted dark:text-ink-muted-dark uppercase tracking-widest">
    Loading...
  </div>
{:else}
  <div class="h-screen w-screen overflow-hidden bg-paper dark:bg-paper-dark text-ink dark:text-ink-dark font-sans selection:bg-hairline flex flex-col transition-colors duration-150">
    
    {#if $currentSession}
      <SplitLayout />
    {:else}
      <!-- LANDING PAGE LAYOUT -->
      <div class="flex flex-col lg:flex-row h-full w-full">
        <!-- LEFT PANEL: Restrained, Academic Editorial Typography -->
        <div class="w-full lg:w-[42%] h-full bg-paper dark:bg-paper-dark flex flex-col justify-between p-8 sm:p-12 lg:p-14 border-b lg:border-b-0 lg:border-r border-hairline dark:border-hairline-dark relative z-10 overflow-y-auto doc-scroll">
          
          <!-- Top Section: Minimalist Nav -->
          <div class="flex justify-between items-center w-full">
            <span class="font-serif text-lg font-normal tracking-tight text-ink dark:text-ink-dark">
              Proposal Arena
            </span>

            <div class="flex items-center gap-4 text-xs font-mono">
              <button
                on:click={toggleLanguage}
                class="text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark transition-colors uppercase tracking-wider"
                title="Toggle Language"
              >
                {$uiLanguage}
              </button>
              <button
                on:click={() => $showSettings = true}
                class="text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark transition-colors p-1"
                title={$t('settings.title')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </button>
            </div>
          </div>

          <!-- Middle Section: Quiet Academic Headline & Context -->
          <div class="my-auto py-8 max-w-md w-full space-y-6">
            <h1 class="font-serif text-3xl sm:text-4xl lg:text-[2.75rem] font-normal text-ink dark:text-ink-dark tracking-tight leading-[1.15]">
              Simulasi Ujian <br />
              <span class="text-ink-muted dark:text-ink-muted-dark">Proposal Tesis.</span>
            </h1>

            <p class="text-sm sm:text-base text-ink-muted dark:text-ink-muted-dark leading-relaxed font-sans font-normal">
              Latih kesiapan mempertahankan metodologi, rumusan masalah, dan kontribusi riset Anda di hadapan penguji AI mandiri sebelum hari-H ujian sidang.
            </p>

            <!-- 3-Step Process (Hairline Editorial List) -->
            <div class="pt-4 space-y-3 text-xs text-ink-muted dark:text-ink-muted-dark border-t border-hairline dark:border-hairline-dark">
              <div class="flex items-start gap-3">
                <span class="font-mono text-ink-faint dark:text-ink-faint-dark pt-0.5">01</span>
                <span>Unggah naskah proposal PDF. Teks dianalisis langsung di browser.</span>
              </div>
              <div class="flex items-start gap-3">
                <span class="font-mono text-ink-faint dark:text-ink-faint-dark pt-0.5">02</span>
                <span>Jawab pertanyaan penguji secara lisan (bebas tangan) atau tertulis.</span>
              </div>
              <div class="flex items-start gap-3">
                <span class="font-mono text-ink-faint dark:text-ink-faint-dark pt-0.5">03</span>
                <span>Terima catatan bimbingan komprehensif, evaluasi argumen, dan pertanyaan drill mandiri.</span>
              </div>
            </div>

            <!-- API Key Status Row -->
            <ApiKeyGuide />
          </div>

          <!-- Bottom Footer Note -->
          <div class="pt-6 border-t border-hairline dark:border-hairline-dark text-[11px] font-mono text-ink-faint dark:text-ink-faint-dark flex justify-between items-center">
            <span>Privat & Lokal di Peramban</span>
            <span>Tanpa Server Backend</span>
          </div>

        </div>

        <!-- RIGHT PANEL: 58% width. Clean Editorial Dropzone -->
        <div class="w-full lg:w-[58%] h-full relative">
          <FileUploader />
        </div>
      </div>
    {/if}
  </div>

  {#if $showSettings}
    <SettingsModal bind:isOpen={$showSettings} />
  {/if}
{/if}
