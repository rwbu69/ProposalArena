<script lang="ts">
  import './i18n/index'; // Initialize i18n first
  import { onMount } from 'svelte';
  import { currentSession, restoreActiveSession } from './lib/interview/controller';
  import { uiLanguage, showSettings } from './lib/state/stores';
  import { initTheme } from './lib/state/theme';
  import FileUploader from './components/upload/FileUploader.svelte';
  import SplitLayout from './components/layout/SplitLayout.svelte';
  import SettingsModal from './components/layout/SettingsModal.svelte';
  import Icon from './components/common/Icon.svelte';
  import { t, isLoading } from 'svelte-i18n';

  onMount(() => {
    restoreActiveSession();
    return initTheme();
  });

  function toggleLanguage() {
    const currentLang = uiLanguage.get();
    uiLanguage.set(currentLang === 'en' ? 'id' : 'en');
  }
</script>

{#if $isLoading}
  <div class="min-h-screen bg-paper dark:bg-paper-dark flex items-center justify-center font-mono text-xs text-ink-muted dark:text-ink-muted-dark uppercase tracking-widest">
    {$t('landing.loading')}
  </div>
{:else}
  <div class="h-screen w-screen overflow-hidden bg-paper dark:bg-paper-dark text-ink dark:text-ink-dark font-sans selection:bg-hairline flex flex-col transition-colors duration-150">
    
    {#if $currentSession}
      <SplitLayout />
    {:else}
      <!-- LANDING PAGE LAYOUT -->
      <div class="flex flex-col lg:flex-row h-full w-full">
        <!-- LEFT PANEL: Restrained, Academic Editorial Typography -->
        <div class="w-full lg:w-[42%] h-full bg-paper dark:bg-paper-dark flex flex-col p-8 sm:p-12 lg:p-14 border-b lg:border-b-0 lg:border-r border-hairline dark:border-hairline-dark relative z-10 overflow-y-auto doc-scroll">
          
          <!-- Top Section: Minimalist Nav -->
          <div class="flex justify-between items-center w-full">
            <div class="flex items-center">
              <span class="font-serif text-lg font-medium tracking-tight text-ink dark:text-ink-dark">
                {$t('landing.appName')}
              </span>
            </div>

            <div class="flex items-center gap-2 text-xs font-sans">
              <button
                type="button"
                on:click={toggleLanguage}
                class="min-w-[40px] min-h-[40px] text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark transition-colors font-medium px-3 py-2 rounded-md border border-hairline/80 dark:border-hairline-dark/80 hover:bg-hairline/40 dark:hover:bg-hairline-dark/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink dark:focus-visible:ring-ink-dark cursor-pointer flex items-center justify-center"
                aria-label={$t('landing.toggleLanguageAria')}
                title={$t('landing.toggleLanguage')}
              >
                {$uiLanguage === 'id' ? 'ID' : 'EN'}
              </button>
              <button
                type="button"
                on:click={() => showSettings.set(true)}
                class="w-10 h-10 text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark transition-colors rounded-md hover:bg-hairline/40 dark:hover:bg-hairline-dark/40 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ink dark:focus-visible:ring-ink-dark cursor-pointer"
                aria-label={$t('landing.settingsAria')}
                title={$t('landing.settings')}
              >
                <Icon name="settings" size={16} />
              </button>
            </div>
          </div>

          <!-- Main Content: Flows naturally from top with comfortable spacing -->
          <div class="mt-14 sm:mt-18 lg:mt-24 max-w-lg w-full space-y-6">
            <h1 class="font-serif text-3xl sm:text-4xl lg:text-[2.85rem] font-medium text-ink dark:text-ink-dark tracking-tight leading-[1.14]">
              {$t('landing.headline')}
            </h1>

            <p class="text-sm sm:text-base text-ink-muted dark:text-ink-muted-dark leading-relaxed font-sans font-normal max-w-md">
              {$t('landing.description')}
            </p>
          </div>

        </div>

        <!-- RIGHT PANEL: 58% width. Clean Editorial Dropzone -->
        <div class="w-full lg:w-[58%] h-full relative">
          <FileUploader />
        </div>
      </div>
    {/if}
  </div>

  <SettingsModal />
{/if}
