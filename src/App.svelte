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
  import Icon from './components/common/Icon.svelte';
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
            <span class="font-serif text-lg font-normal tracking-tight text-ink dark:text-ink-dark">
              {$t('landing.appName')}
            </span>

            <div class="flex items-center gap-4 text-xs font-mono">
              <button
                type="button"
                on:click={toggleLanguage}
                class="text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark transition-colors uppercase tracking-wider p-1 rounded-xs focus:outline-none focus-visible:ring-1 focus-visible:ring-ink dark:focus-visible:ring-ink-dark"
                aria-label={$t('landing.toggleLanguageAria')}
                title={$t('landing.toggleLanguage')}
              >
                {$uiLanguage}
              </button>
              <button
                type="button"
                on:click={() => $showSettings = true}
                class="text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark transition-colors p-1 rounded-xs flex items-center justify-center focus:outline-none focus-visible:ring-1 focus-visible:ring-ink dark:focus-visible:ring-ink-dark"
                aria-label={$t('landing.settingsAria')}
                title={$t('landing.settings')}
              >
                <Icon name="settings" size={16} />
              </button>
            </div>
          </div>

          <!-- Main Content: Flows naturally from top with comfortable spacing -->
          <div class="mt-12 sm:mt-16 lg:mt-20 max-w-md w-full space-y-6">
            <h1 class="font-serif text-3xl sm:text-4xl lg:text-[2.75rem] font-normal text-ink dark:text-ink-dark tracking-tight leading-[1.15]">
              {$t('landing.headline')}
            </h1>

            <p class="text-sm sm:text-base text-ink-muted dark:text-ink-muted-dark leading-relaxed font-sans font-normal">
              {$t('landing.description')}
            </p>

            <!-- API Key Status Row -->
            <ApiKeyGuide />
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
