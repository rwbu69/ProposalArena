<script lang="ts">
  import './i18n/index'; // Initialize i18n first
  import { currentSession } from './lib/interview/controller';
  import { uiLanguage, showSettings } from './lib/state/stores';
  import FileUploader from './components/upload/FileUploader.svelte';
  import SplitLayout from './components/layout/SplitLayout.svelte';
  import SettingsModal from './components/layout/SettingsModal.svelte';
  import { t, isLoading } from 'svelte-i18n';

  function toggleLanguage() {
    const currentLang = uiLanguage.get();
    uiLanguage.set(currentLang === 'en' ? 'id' : 'en');
  }
</script>

{#if $isLoading}
  <div class="min-h-screen bg-white dark:bg-space-left flex items-center justify-center font-sans">
    <div class="text-zinc-500 dark:text-space-textMuted font-medium tracking-widest text-sm uppercase">Loading...</div>
  </div>
{:else}
  <div class="h-screen w-screen overflow-hidden bg-white dark:bg-space-left text-black dark:text-white font-sans font-light flex flex-col transition-colors duration-200">
    
    {#if $currentSession}
      <SplitLayout />
    {:else}
      <!-- LANDING PAGE LAYOUT -->
      <div class="flex flex-col lg:flex-row h-full w-full">
        <!-- LEFT PANEL: 40% width. Spatial typography, pushed to corners. -->
        <div class="w-full lg:w-[40%] h-full bg-white dark:bg-space-left flex flex-col justify-between p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-zinc-200 dark:border-space-border relative z-10">
          
          <!-- Top Section: Minimalist Nav -->
          <div class="flex justify-end items-start w-full">
            <div class="flex gap-4">
              <button
                on:click={toggleLanguage}
                class="text-zinc-500 dark:text-space-textMuted hover:text-black dark:hover:text-space-textHighlight transition-colors text-sm font-medium uppercase tracking-wider"
              >
                {$uiLanguage}
              </button>
              <button
                on:click={() => $showSettings = true}
                class="text-zinc-500 dark:text-space-textMuted hover:text-black dark:hover:text-space-textHighlight transition-colors"
                title={$t('settings.title')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </button>
            </div>
          </div>

          <!-- Bottom Section: Title -->
          <div class="mb-4 mt-12 lg:mt-0">
            <h1 class="text-5xl md:text-6xl lg:text-[4rem] leading-none font-medium text-black dark:text-space-textHighlight tracking-tight mb-6">
              Arena <br />
              <span class="text-zinc-500 dark:text-space-textSoft">Proposal.</span>
            </h1>
            <p class="text-zinc-600 dark:text-space-textMuted text-base md:text-lg max-w-sm leading-relaxed font-light">
              {$t('app.subtitle')}
            </p>
          </div>
        </div>

        <!-- RIGHT PANEL: 60% width. The Uploader. -->
        <div class="w-full lg:w-[60%] h-full relative">
          <FileUploader />
        </div>
      </div>
    {/if}
  </div>

  {#if $showSettings}
    <SettingsModal bind:isOpen={$showSettings} />
  {/if}
{/if}
