<script lang="ts">
  import { currentReport } from '../../lib/interview/controller';
</script>

<div class="flex-1 overflow-y-auto p-8 bg-slate-50 text-slate-800">
  <h2 class="text-3xl font-extrabold mb-6">Defense Report</h2>
  
  {#if !$currentReport}
    <div class="flex justify-center items-center h-48 text-slate-500">
      <div class="animate-pulse">Analyzing the interview transcript...</div>
    </div>
  {:else}
    <div class="space-y-8">
      <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 class="text-xl font-bold mb-3 text-slate-900">Summary</h3>
        <p class="text-slate-700 leading-relaxed">{$currentReport.summary}</p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-green-50 p-6 rounded-xl border border-green-100">
          <h3 class="text-xl font-bold mb-3 text-green-900">Strengths</h3>
          <ul class="list-disc list-inside space-y-2 text-green-800">
            {#each $currentReport.strengths as strength}
              <li>{strength}</li>
            {/each}
          </ul>
        </div>
        
        <div class="bg-red-50 p-6 rounded-xl border border-red-100">
          <h3 class="text-xl font-bold mb-3 text-red-900">Weaknesses</h3>
          <ul class="list-disc list-inside space-y-2 text-red-800">
            {#each $currentReport.weaknesses as weakness}
              <li>{weakness}</li>
            {/each}
          </ul>
        </div>
      </div>
      
      <div class="bg-blue-50 p-6 rounded-xl border border-blue-100">
        <h3 class="text-xl font-bold mb-3 text-blue-900">Recommendations</h3>
        <ul class="list-disc list-inside space-y-2 text-blue-800">
          {#each $currentReport.recommendations as recommendation}
            <li>{recommendation}</li>
          {/each}
        </ul>
      </div>
      
      <div class="bg-amber-50 p-6 rounded-xl border border-amber-100">
        <h3 class="text-xl font-bold mb-3 text-amber-900">Practice Questions</h3>
        <ul class="list-decimal list-inside space-y-2 text-amber-800">
          {#each $currentReport.practiceQuestions as pq}
            <li>{pq}</li>
          {/each}
        </ul>
      </div>
    </div>
  {/if}
</div>
