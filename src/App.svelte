<script lang="ts">
  import { currentSession } from './lib/interview/controller';
  import FileUploader from './components/upload/FileUploader.svelte';
  import SplitLayout from './components/layout/SplitLayout.svelte';
  import SettingsModal from './components/layout/SettingsModal.svelte';
</script>

<SettingsModal />

<main class="min-h-screen bg-slate-50 text-slate-900 font-sans">
  {#if $currentSession}
    <SplitLayout />
  {:else}
    <div class="py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl mx-auto text-center mb-12">
        <h1 class="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
          AI Thesis Defense Simulator
        </h1>
        <p class="mt-4 text-xl text-slate-500">
          Upload your proposal, and face an AI examiner to prepare for your defense.
        </p>
      </div>
      <FileUploader />
    </div>
  {/if}
</main>
