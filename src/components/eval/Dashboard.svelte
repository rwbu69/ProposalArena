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

<div class="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 h-[calc(100vh-100px)] font-sans text-ink dark:text-ink-dark">
  <!-- Sidebar -->
  <div class="w-full lg:w-1/3 bg-paper dark:bg-paper-dark border-y border-hairline dark:border-hairline-dark overflow-y-auto flex flex-col">
    <div class="p-4 border-b border-hairline dark:border-hairline-dark font-mono text-xs uppercase tracking-wider text-ink-muted dark:text-ink-muted-dark sticky top-0 bg-paper dark:bg-paper-dark">Past Sessions</div>
    {#if sessions.length === 0}
      <div class="p-6 text-center text-sm text-ink-muted dark:text-ink-muted-dark">No sessions found.</div>
    {/if}
    {#each sessions as s}
      <button 
        class="w-full text-left p-4 border-b border-hairline dark:border-hairline-dark hover:bg-paper-surface dark:hover:bg-paper-surface-dark transition-colors {selectedSession?.id === s.id ? 'bg-paper-surface dark:bg-paper-surface-dark border-l-2 border-l-accent dark:border-l-accent-dark' : ''}"
        on:click={() => selectSession(s)}>
        <p class="font-serif text-base truncate">{s.proposalTitle}</p>
        <p class="text-[10px] font-mono text-ink-faint dark:text-ink-faint-dark mt-1">ID: {s.id.slice(0,8)}... · State: {s.state}</p>
      </button>
    {/each}
  </div>

  <!-- Main Content -->
  <div class="w-full lg:w-2/3 bg-paper dark:bg-paper-dark border-y border-hairline dark:border-hairline-dark overflow-y-auto p-6 lg:p-8">
    {#if selectedSession}
      <h2 class="font-serif text-2xl font-normal tracking-tight mb-8">Evaluating Session</h2>
      
      <div class="space-y-8">
        {#each messages as msg}
          {#if msg.role === 'assistant'}
            <div class="bg-paper-surface dark:bg-paper-surface-dark p-5 border-y border-hairline dark:border-hairline-dark">
              <span class="text-[10px] font-mono uppercase tracking-widest text-ink-faint dark:text-ink-faint-dark mb-2 block">AI Question</span>
              <p class="font-serif text-ink dark:text-ink-dark mb-6 leading-relaxed">{msg.content}</p>
              
              <div class="flex flex-col gap-4 border-t border-hairline dark:border-hairline-dark pt-4">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-mono text-ink-muted dark:text-ink-muted-dark">Relevance (1-5)</span>
                  <div class="flex gap-1">
                    {#each [1,2,3,4,5] as i}
                      <button 
                        on:click={() => saveScore(msg.id, 'relevance', i)}
                        class="w-8 h-8 rounded-xs border border-hairline dark:border-hairline-dark flex items-center justify-center transition-colors
                          {judgments[msg.id]?.relevanceScore === i ? 'bg-accent text-paper border-accent' : 'bg-paper dark:bg-paper-dark hover:bg-paper-surface dark:hover:bg-paper-surface-dark text-ink-muted dark:text-ink-muted-dark'}">
                        {i}
                      </button>
                    {/each}
                  </div>
                </div>
                
                <div class="flex items-center justify-between">
                  <span class="text-xs font-mono text-ink-muted dark:text-ink-muted-dark">Difficulty (1-5)</span>
                  <div class="flex gap-1">
                    {#each [1,2,3,4,5] as i}
                      <button 
                        on:click={() => saveScore(msg.id, 'difficulty', i)}
                        class="w-8 h-8 rounded-xs border border-hairline dark:border-hairline-dark flex items-center justify-center transition-colors
                          {judgments[msg.id]?.difficultyScore === i ? 'bg-ink text-paper dark:bg-ink-dark dark:text-paper-dark border-ink' : 'bg-paper dark:bg-paper-dark hover:bg-paper-surface dark:hover:bg-paper-surface-dark text-ink-muted dark:text-ink-muted-dark'}">
                        {i}
                      </button>
                    {/each}
                  </div>
                </div>
              </div>
            </div>
          {:else if msg.role === 'user'}
            <div class="pl-4 lg:pl-8">
              <span class="text-[10px] font-mono uppercase tracking-widest text-ink-faint dark:text-ink-faint-dark mb-1 block">Student Answer</span>
              <p class="text-sm text-ink-muted dark:text-ink-muted-dark italic border-l-2 border-hairline dark:border-hairline-dark pl-3">{msg.content}</p>
            </div>
          {/if}
        {/each}
      </div>
    {:else}
      <div class="h-full flex flex-col items-center justify-center text-ink-faint dark:text-ink-faint-dark">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mb-4 opacity-50"><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10.4 12.6a2 2 0 1 1 3 3L8 21l-4 1 1-4Z"/><path d="M18 21V10l-6-6H6a2 2 0 0 0-2 2v15"/></svg>
        <p>Select a session from the sidebar to evaluate.</p>
      </div>
    {/if}
  </div>
</div>
