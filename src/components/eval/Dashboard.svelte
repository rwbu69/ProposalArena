<script lang="ts">
  import { onMount } from 'svelte';
  import { dbStore } from '../../lib/db/database';
  import type { InterviewSession, InterviewMessage, HumanJudgment, Proposal } from '../../types/domain';
  import { v4 as uuidv4 } from 'uuid';

  let sessions: (InterviewSession & { proposalTitle?: string })[] = [];
  let selectedSession: InterviewSession | null = null;
  let messages: InterviewMessage[] = [];
  let judgments: Record<string, HumanJudgment> = {};

  onMount(async () => {
    await loadSessions();
  });

  async function loadSessions() {
    const allSessions = await dbStore.getAllSessions();
    
    // Attach proposal titles for better UX
    const enhanced = await Promise.all(allSessions.map(async s => {
      const p = await dbStore.getProposal(s.proposalId);
      return { ...s, proposalTitle: p?.title || 'Unknown Proposal' };
    }));
    
    sessions = enhanced.sort((a, b) => b.createdAt - a.createdAt);
  }

  async function selectSession(session: InterviewSession) {
    selectedSession = session;
    messages = await dbStore.getMessages(session.id);
    
    const existing = await dbStore.getJudgments(session.id);
    judgments = {};
    for (const j of existing) {
      judgments[j.messageId] = j;
    }
  }

  async function saveScore(messageId: string, type: 'relevance' | 'difficulty', score: number) {
    if (!selectedSession) return;
    
    if (!judgments[messageId]) {
      judgments[messageId] = {
        id: `judg_${selectedSession.id}_${messageId}`,
        sessionId: selectedSession.id,
        messageId,
        relevanceScore: 0,
        difficultyScore: 0,
        evaluatedAt: Date.now()
      };
    }
    
    if (type === 'relevance') judgments[messageId].relevanceScore = score;
    if (type === 'difficulty') judgments[messageId].difficultyScore = score;
    
    judgments[messageId].evaluatedAt = Date.now();
    await dbStore.saveJudgment(judgments[messageId]);
    
    // trigger reactivity
    judgments = { ...judgments };
  }
</script>

<div class="max-w-6xl mx-auto flex gap-6 h-[calc(100vh-100px)]">
  <!-- Sidebar -->
  <div class="w-1/3 bg-white border border-slate-200 rounded-xl overflow-y-auto flex flex-col">
    <div class="p-4 border-b border-slate-200 bg-slate-50 font-semibold sticky top-0">Past Sessions</div>
    {#if sessions.length === 0}
      <div class="p-6 text-center text-slate-500">No sessions found.</div>
    {/if}
    {#each sessions as s}
      <button 
        class="w-full text-left p-4 border-b border-slate-100 hover:bg-blue-50 transition-colors {selectedSession?.id === s.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}"
        on:click={() => selectSession(s)}>
        <p class="font-medium truncate">{s.proposalTitle}</p>
        <p class="text-xs text-slate-500 mt-1">ID: {s.id.slice(0,8)}... • State: {s.state}</p>
      </button>
    {/each}
  </div>

  <!-- Main Content -->
  <div class="w-2/3 bg-white border border-slate-200 rounded-xl overflow-y-auto p-6">
    {#if selectedSession}
      <h2 class="text-2xl font-bold mb-6">Evaluating Session</h2>
      
      <div class="space-y-8">
        {#each messages as msg}
          {#if msg.role === 'assistant'}
            <div class="bg-slate-50 rounded-lg p-5 border border-slate-200 shadow-sm">
              <span class="text-xs font-bold uppercase text-blue-600 mb-2 block">AI Question</span>
              <p class="text-slate-800 mb-6">{msg.content}</p>
              
              <div class="flex flex-col gap-4 border-t border-slate-200 pt-4">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium">Relevance (1-5)</span>
                  <div class="flex gap-1">
                    {#each [1,2,3,4,5] as i}
                      <button 
                        on:click={() => saveScore(msg.id, 'relevance', i)}
                        class="w-8 h-8 rounded-full border flex items-center justify-center transition-colors
                          {judgments[msg.id]?.relevanceScore === i ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-slate-100 text-slate-600'}">
                        {i}
                      </button>
                    {/each}
                  </div>
                </div>
                
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium">Difficulty (1-5)</span>
                  <div class="flex gap-1">
                    {#each [1,2,3,4,5] as i}
                      <button 
                        on:click={() => saveScore(msg.id, 'difficulty', i)}
                        class="w-8 h-8 rounded-full border flex items-center justify-center transition-colors
                          {judgments[msg.id]?.difficultyScore === i ? 'bg-amber-500 text-white border-amber-500' : 'bg-white hover:bg-slate-100 text-slate-600'}">
                        {i}
                      </button>
                    {/each}
                  </div>
                </div>
              </div>
            </div>
          {:else if msg.role === 'user'}
            <div class="pl-8">
              <span class="text-xs font-bold uppercase text-green-600 mb-1 block">Student Answer</span>
              <p class="text-slate-600 italic border-l-4 border-green-200 pl-3">{msg.content}</p>
            </div>
          {/if}
        {/each}
      </div>
    {:else}
      <div class="h-full flex flex-col items-center justify-center text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mb-4 opacity-50"><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10.4 12.6a2 2 0 1 1 3 3L8 21l-4 1 1-4Z"/><path d="M18 21V10l-6-6H6a2 2 0 0 0-2 2v15"/></svg>
        <p>Select a session from the sidebar to evaluate.</p>
      </div>
    {/if}
  </div>
</div>
