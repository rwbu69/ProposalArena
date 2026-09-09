<script lang="ts">
  import { currentSession } from './lib/interview/controller';
  import FileUploader from './components/upload/FileUploader.svelte';
  import SplitLayout from './components/layout/SplitLayout.svelte';
  import SettingsModal from './components/layout/SettingsModal.svelte';
</script>

<main class="min-h-screen bg-slate-50 text-slate-900 font-sans">
  {#if $currentSession}
    <SplitLayout />
  {:else}
    <div class="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div class="text-center mb-12">
        <h1 class="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
          Proposal Arena
        </h1>
        <p class="mt-4 text-xl text-slate-500">
          Upload your proposal, configure your AI examiner, and start your defense.
        </p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <SettingsModal />
        </div>
        <div>
          <FileUploader />
        </div>
      </div>
    </div>
  {/if}
</main>
