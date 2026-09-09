<script lang="ts">
  import { onMount } from 'svelte';
  import { dbStore } from '../../lib/db/database';
  import type { DefenseReport, InterviewSession } from '../../types/domain';
  
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

<div class="min-h-screen bg-slate-50 text-slate-800 p-8">
  <div class="max-w-5xl mx-auto">
    <div class="flex justify-between items-center mb-8">
      <h2 class="text-3xl font-extrabold text-slate-900">Defense Report</h2>
      <a href="/" class="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg shadow-sm hover:bg-slate-50 transition-colors font-medium">Return to Arena</a>
    </div>
    
    {#if !report}
      <div class="flex justify-center items-center h-48 text-slate-500">
        <div class="animate-pulse">Loading report...</div>
      </div>
    {:else}
    <div class="space-y-8">
        <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 class="text-xl font-bold mb-3 text-slate-900">Summary</h3>
          <p class="text-slate-700 leading-relaxed">{report.summary}</p>
          {#if session?.interruptions && session.interruptions > 0}
            <div class="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 text-sm font-medium rounded-md border border-amber-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              Session Integrity: You switched tabs or lost window focus {session.interruptions} time{session.interruptions === 1 ? '' : 's'} during the defense.
            </div>
          {/if}
        </div>
        
        {#if report.notes && report.notes.length > 0}
          <div class="bg-purple-50 p-6 rounded-xl border border-purple-100">
            <h3 class="text-xl font-bold mb-3 text-purple-900">Examiner's Notes & Feedback</h3>
            <ul class="list-disc list-inside space-y-2 text-purple-800">
              {#each report.notes as note}
                <li>{note}</li>
              {/each}
            </ul>
          </div>
        {/if}
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-green-50 p-6 rounded-xl border border-green-100">
          <h3 class="text-xl font-bold mb-3 text-green-900">Strengths</h3>
          <ul class="list-disc list-inside space-y-2 text-green-800">
            {#each report.strengths as strength}
              <li>{strength}</li>
            {/each}
          </ul>
        </div>
        
        <div class="bg-red-50 p-6 rounded-xl border border-red-100">
          <h3 class="text-xl font-bold mb-3 text-red-900">Weaknesses</h3>
          <ul class="list-disc list-inside space-y-2 text-red-800">
            {#each report.weaknesses as weakness}
              <li>{weakness}</li>
            {/each}
          </ul>
        </div>
      </div>
      
      <div class="bg-blue-50 p-6 rounded-xl border border-blue-100">
        <h3 class="text-xl font-bold mb-3 text-blue-900">Recommendations</h3>
        <ul class="list-disc list-inside space-y-2 text-blue-800">
          {#each report.recommendations as recommendation}
            <li>{recommendation}</li>
          {/each}
        </ul>
      </div>
      
      <div class="bg-amber-50 p-6 rounded-xl border border-amber-100">
        <h3 class="text-xl font-bold mb-3 text-amber-900">Practice Questions</h3>
        <ul class="list-decimal list-inside space-y-2 text-amber-800">
          {#each report.practiceQuestions as pq}
            <li>{pq}</li>
          {/each}
        </ul>
      </div>
    </div>
  {/if}
  </div>
</div>
