<script lang="ts">
  import '../../i18n/index'; // Initialize i18n first
  import { onMount } from 'svelte';
  import { dbStore } from '../../lib/db/database';
  import type { DefenseReport, InterviewSession } from '../../types/domain';
  import { t, isLoading } from 'svelte-i18n';
  
  let report: DefenseReport | null = null;
  let session: InterviewSession | null = null;

  onMount(async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      report = await dbStore.getReport(id) || null;
      session = await dbStore.getSession(id) || null;
    }
  });
</script>

{#if $isLoading}
  <div class="min-h-screen bg-white dark:bg-paper-bg flex items-center justify-center font-sans">
    <div class="text-zinc-500 dark:text-space-textMuted font-medium tracking-widest text-sm uppercase">Loading...</div>
  </div>
{:else}
<div class="min-h-screen bg-white dark:bg-paper-bg text-black dark:text-white font-sans font-light p-6 lg:p-16">
  <div class="max-w-[960px] mx-auto w-full">
    
    <!-- HEADER -->
    <header class="flex justify-between items-end mb-20 border-b border-zinc-200 dark:border-space-borderSoft pb-8">
      <div>
        <p class="text-zinc-500 dark:text-space-textMuted text-[10px] uppercase tracking-[0.2em] mb-3 font-medium">Evaluasi</p>
        <h1 class="text-4xl lg:text-5xl font-medium tracking-tight text-black dark:text-space-textHighlight">{$t('report.title')}.</h1>
      </div>
      <a href="/" class="group flex items-center gap-3 text-zinc-500 dark:text-space-textMuted hover:text-black dark:hover:text-space-textHighlight transition-colors text-sm font-medium uppercase tracking-wider">
        <span>{$t('report.return')}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
      </a>
    </header>
    
    {#if !report}
      <div class="flex justify-center items-center h-48 text-zinc-500 dark:text-space-textMuted">
        <div class="animate-pulse">{$t('report.loading')}</div>
      </div>
    {:else}
      
      <!-- 01: Ringkasan -->
      <div class="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8 lg:gap-24 mb-24 items-start relative">
        <div class="lg:sticky lg:top-12">
          <span class="text-zinc-400 dark:text-space-textSoft font-mono text-xs mb-2 block">01</span>
          <h3 class="text-xl font-medium text-black dark:text-space-textHighlight">{$t('report.summary')}</h3>
        </div>
        
        <div class="prose prose-lg dark:prose-invert max-w-none prose-p:text-zinc-700 dark:prose-p:text-space-textSoft prose-p:font-light prose-p:leading-relaxed">
          <p>{report.summary}</p>
          
          {#if session?.interruptions && session.interruptions > 0}
            <div class="mt-8 inline-flex items-start gap-3 p-5 border-l-2 border-zinc-200 dark:border-[#333] bg-zinc-50 dark:bg-[#151515] text-sm">
              <svg class="mt-0.5 shrink-0 text-zinc-500 dark:text-space-textMuted" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              <span class="font-light text-zinc-600 dark:text-space-textMuted">{$t('integrity.reportWarning').replace('{count}', session.interruptions.toString())}</span>
            </div>
          {/if}
          
          {#if report.notes && report.notes.length > 0}
            <h4 class="text-lg font-medium text-black dark:text-space-textHighlight mt-8 mb-4">{$t('report.notes')}</h4>
            <ul class="list-none p-0 m-0 space-y-4">
              {#each report.notes as note}
                <li class="relative pl-6 before:content-[''] before:absolute before:left-0 before:top-2.5 before:w-1.5 before:h-1.5 before:bg-zinc-300 dark:before:bg-space-border text-zinc-700 dark:text-space-textSoft leading-relaxed">{note}</li>
              {/each}
            </ul>
          {/if}
        </div>
      </div>
      
      <!-- 02: Kekuatan & Kelemahan -->
      <div class="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8 lg:gap-24 mb-24 items-start relative border-t border-zinc-200 dark:border-space-borderSoft pt-16">
        <div class="lg:sticky lg:top-12">
          <span class="text-zinc-400 dark:text-space-textSoft font-mono text-xs mb-2 block">02</span>
          <h3 class="text-xl font-medium text-black dark:text-space-textHighlight">Evaluasi Kritis</h3>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
          <!-- Strengths -->
          <div>
            <h4 class="text-sm tracking-[0.2em] uppercase text-zinc-500 dark:text-space-textMuted font-medium mb-6">{$t('report.strengths')}</h4>
            <ul class="list-none p-0 m-0 space-y-4">
              {#each report.strengths as strength}
                <li class="relative pl-6 before:content-[''] before:absolute before:left-0 before:top-2.5 before:w-1.5 before:h-1.5 before:bg-black dark:before:bg-space-textSoft text-zinc-700 dark:text-space-textSoft leading-relaxed">{strength}</li>
              {/each}
            </ul>
          </div>
          
          <!-- Weaknesses -->
          <div>
            <h4 class="text-sm tracking-[0.2em] uppercase text-zinc-500 dark:text-space-textMuted font-medium mb-6">{$t('report.weaknesses')}</h4>
            <ul class="list-none p-0 m-0 space-y-4">
              {#each report.weaknesses as weakness}
                <li class="relative pl-6 before:content-[''] before:absolute before:left-0 before:top-2.5 before:w-1.5 before:h-1.5 before:bg-transparent before:border before:border-black dark:before:border-space-textSoft text-zinc-700 dark:text-space-textSoft leading-relaxed">{weakness}</li>
              {/each}
            </ul>
          </div>
        </div>
      </div>
      
      <!-- 03: Rekomendasi -->
      <div class="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8 lg:gap-24 mb-24 items-start relative border-t border-zinc-200 dark:border-space-borderSoft pt-16">
        <div class="lg:sticky lg:top-12">
          <span class="text-zinc-400 dark:text-space-textSoft font-mono text-xs mb-2 block">03</span>
          <h3 class="text-xl font-medium text-black dark:text-space-textHighlight">{$t('report.recommendations')}</h3>
        </div>
        
        <div>
          <ul class="list-none p-0 m-0 space-y-6">
            {#each report.recommendations as rec, i}
              <li class="flex gap-6 group">
                <span class="text-zinc-300 dark:text-[#333] font-mono text-sm pt-1 group-hover:text-black dark:group-hover:text-space-textSoft transition-colors">{(i + 1).toString().padStart(2, '0')}</span>
                <p class="text-zinc-700 dark:text-space-textSoft leading-relaxed font-light">{rec}</p>
              </li>
            {/each}
          </ul>
        </div>
      </div>
      
      <!-- 04: Latihan -->
      <div class="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8 lg:gap-24 pb-24 items-start relative border-t border-zinc-200 dark:border-space-borderSoft pt-16">
        <div class="lg:sticky lg:top-12">
          <span class="text-zinc-400 dark:text-space-textSoft font-mono text-xs mb-2 block">04</span>
          <h3 class="text-xl font-medium text-black dark:text-space-textHighlight">{$t('report.practice')}</h3>
        </div>
        
        <div>
          <ul class="list-none p-0 m-0 space-y-6">
            {#each report.practiceQuestions as pq, i}
              <li class="flex gap-6 group">
                <span class="text-zinc-300 dark:text-[#333] font-mono text-sm pt-1 group-hover:text-black dark:group-hover:text-space-textSoft transition-colors">{(i + 1).toString().padStart(2, '0')}</span>
                <p class="text-zinc-700 dark:text-space-textSoft leading-relaxed font-light">{pq}</p>
              </li>
            {/each}
          </ul>
        </div>
      </div>

    {/if}
  </div>
</div>
{/if}
