<script lang="ts">
  import './i18n/index'; // Initialize i18n first
  import { currentSession } from './lib/interview/controller';
  import { uiLanguage, showSettings } from './lib/state/stores';
  import FileUploader from './components/upload/FileUploader.svelte';
  import SplitLayout from './components/layout/SplitLayout.svelte';
  import SettingsModal from './components/layout/SettingsModal.svelte';
  import ApiTutorialDrawer from './components/layout/ApiTutorialDrawer.svelte';
  import { t, isLoading } from 'svelte-i18n';

  let showTutorial = false;

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
          <div class="mb-4 mt-12 lg:mt-0 max-w-md">
            <h1 class="text-5xl md:text-6xl lg:text-[4rem] leading-none font-medium text-black dark:text-space-textHighlight tracking-tight mb-6">
              Arena <br />
              <span class="text-zinc-500 dark:text-space-textSoft">Proposal.</span>
            </h1>
            <p class="text-zinc-600 dark:text-space-textMuted text-base md:text-lg leading-relaxed font-light mb-10">
              {$t('app.subtitle')}
            </p>

            <!-- Action Steps -->
            <div class="flex flex-col gap-5 mb-10">
              <div class="flex items-start gap-4">
                <div class="flex items-center justify-center w-7 h-7 rounded-full bg-black/5 dark:bg-white/10 text-black dark:text-white text-sm font-semibold shrink-0 mt-0.5">1</div>
                <div class="text-zinc-600 dark:text-zinc-400 text-[0.95rem] leading-relaxed">
                  <strong class="text-black dark:text-white font-medium block">{$t('app.steps.step1Title')}</strong>
                  {$t('app.steps.step1Desc')}
                </div>
              </div>
              
              <div class="flex items-start gap-4">
                <div class="flex items-center justify-center w-7 h-7 rounded-full bg-black/5 dark:bg-white/10 text-black dark:text-white text-sm font-semibold shrink-0 mt-0.5">2</div>
                <div class="text-zinc-600 dark:text-zinc-400 text-[0.95rem] leading-relaxed">
                  <strong class="text-black dark:text-white font-medium block">{$t('app.steps.step2Title')}</strong>
                  {$t('app.steps.step2Desc')}
                </div>
              </div>
              
              <div class="flex items-start gap-4">
                <div class="flex items-center justify-center w-7 h-7 rounded-full bg-black/5 dark:bg-white/10 text-black dark:text-white text-sm font-semibold shrink-0 mt-0.5">3</div>
                <div class="text-zinc-600 dark:text-zinc-400 text-[0.95rem] leading-relaxed">
                  <strong class="text-black dark:text-white font-medium block">{$t('app.steps.step3Title')}</strong>
                  {$t('app.steps.step3Desc')}
                </div>
              </div>
            </div>

            <button 
              on:click={() => showTutorial = true}
              class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-black dark:text-white bg-zinc-100 dark:bg-zinc-800/60 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded-lg transition-colors shadow-sm"
            >
              <svg class="w-4 h-4 text-zinc-500 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              {$t('tutorial.getApiKey')}
            </button>
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

  <ApiTutorialDrawer bind:isOpen={showTutorial} />
{/if}
