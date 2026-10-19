<script lang="ts">
  import '../../i18n/index';
  import { onMount, onDestroy } from 'svelte';
  import { dbStore } from '../../lib/db/database';
  import { normalizeDefenseReport } from '../../lib/ai/pipeline';
  import { initTheme } from '../../lib/state/theme';
  import type { DefenseReport, InterviewSession, Proposal } from '../../types/domain';
  import { t, isLoading } from 'svelte-i18n';
  import Icon from '../common/Icon.svelte';

  let cleanupTheme: (() => void) | null = null;
  cleanupTheme = initTheme();
  onDestroy(() => {
    if (cleanupTheme) cleanupTheme();
  });

  let report: DefenseReport | null = null;
  let session: InterviewSession | null = null;
  let proposal: Proposal | null = null;
  let loadingData = true;
  let isDemo = false;
  let copied = false;
  let copiedQuestionIndex: number | null = null;

  const DEMO_REPORT: DefenseReport = {
    id: 'demo-sample-report',
    summary: `Simulasi sidang proposal ini menunjukkan pemahaman konsep dasar yang baik pada perumusan masalah dan signifikansi penelitian. Argumen pembuka mampu mempertahankan relevansi topik terhadap tantangan nyata di industri dengan data empiris awal yang meyakinkan.

Namun, terdapat area metodologi eksperimen yang masih membutuhkan pendalaman—terutama pemilihan metrik evaluasi komparatif dan mitigasi potensi bias data pengujian. Sebelum sidang sebenarnya, pastikan batasan lingkup riset (scope) diperjelas agar penguji tidak memperluas pertanyaan ke domain di luar tujuan utama proposal.`,
    notes: [
      'Artikulasi jawaban pembuka sangat tenang dan terstruktur dengan metode PIR (Point, Illustration, Reason).',
      'Saat penguji menanyakan alternatif arsitektur model, respon sempat ragu sebelum memberikan perbandingan benchmark.',
      'Disarankan untuk mencatat poin inti pertanyaan penguji di lembar coretan agar jawaban langsung menyasar substansi.'
    ],
    strengths: [
      'Identifikasi rumusan masalah tajam dan didukung rujukan literatur 3 tahun terakhir yang kredibel.',
      'Argumentasi pemilihan pendekatan utama memiliki komparasi teoritis yang jelas dibanding metode konvensional.',
      'Alur logika dari latar belakang masalah menuju tujuan penelitian tersusun runtut dan koheren.'
    ],
    weaknesses: [
      'Validasi dataset uji belum mendokumentasikan distribusi kelas dan teknik partisi (k-fold vs train-test split).',
      'Kompleksitas komputasi belum dianalisis secara eksplisit terhadap batas kapasitas infrastruktur eksperimen.',
      'Ancaman terhadap validitas internal dan eksternal belum diuraikan dalam sub-bab terpisah.'
    ],
    recommendations: [
      'Tambahkan diagram alur proses data pipeline secara mendetail pada Bab 3 sebelum hari-H sidang.',
      'Siapkan 1 slide ringkasan justifikasi matematis pemilihan formula loss function di lampiran presentasi.',
      'Lakukan uji coba awal pada subset data (pilot experiment) untuk menunjukkan kelayakan eksperimen (proof-of-concept).'
    ],
    practiceQuestions: [
      'Mengapa Anda memilih pendekatan ini dibandingkan baseline model X yang memiliki efisiensi komputasi lebih tinggi?',
      'Bagaimana Anda menjamin bahwa data pengujian tidak mengalami data leakage saat tahap pra-pemrosesan?',
      'Jika skenario pengujian di lapangan menghasilkan akurasi di bawah ekspektasi, apa rencana mitigasi metodologi Anda?'
    ],
    generatedAt: Date.now()
  };

  const DEMO_PROPOSAL: Proposal = {
    id: 'demo-sample-proposal',
    title: 'Optimasi Deteksi Anomali Jaringan Berbasis Deep Learning pada Lingkungan Edge Computing',
    text: '',
    language: 'id',
    uploadedAt: Date.now()
  };

  onMount(async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      let id = params.get('id');

      // 1. Fetch by specific ID if passed in URL
      if (id) {
        report = (await dbStore.getReport(id)) || null;
        session = (await dbStore.getSession(id)) || null;
      }

      // 2. Fallback: Query all saved reports directly from IndexedDB
      if (!report) {
        const allReports = await dbStore.getAllReports();
        if (allReports && allReports.length > 0) {
          allReports.sort((a, b) => (b.generatedAt || 0) - (a.generatedAt || 0));
          const latest = allReports[0];
          if (latest) {
            report = latest;
            id = latest.id;
            if (id) {
              session = (await dbStore.getSession(id)) || null;
            }
          }
        }
      }

      // 3. Fallback: Query all sessions from IndexedDB
      if (!report) {
        const allSessions = await dbStore.getAllSessions();
        if (allSessions && allSessions.length > 0) {
          const sorted = [...allSessions].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          for (const s of sorted) {
            const r = await dbStore.getReport(s.id);
            if (r) {
              report = r;
              session = s;
              id = s.id;
              break;
            }
          }
        }
      }

      // 4. Fallback: If no completed report exists in browser storage, provide realistic DEMO_REPORT
      if (!report) {
        report = DEMO_REPORT;
        proposal = DEMO_PROPOSAL;
        isDemo = true;
      } else {
        report = normalizeDefenseReport(report);
      }

      if (session?.proposalId && !isDemo) {
        proposal = (await dbStore.getProposal(session.proposalId)) || null;
      }
    } catch (err) {
      console.error('Failed to load report from IndexedDB:', err);
      if (!report) {
        report = DEMO_REPORT;
        proposal = DEMO_PROPOSAL;
        isDemo = true;
      }
    } finally {
      loadingData = false;
    }
  });

  function handlePrint() {
    window.print();
  }

  async function handleCopyFullReport() {
    if (!report) return;
    const strengths = report.strengths || [];
    const weaknesses = report.weaknesses || [];
    const recommendations = report.recommendations || [];
    const practiceQuestions = report.practiceQuestions || [];
    const notes = report.notes || [];

    const lines = [
      `=== ${$t('report.title').toUpperCase()} ===`,
      proposal?.title ? `Proposal: ${proposal.title}` : '',
      `Waktu: ${formatDate(report.generatedAt || session?.createdAt)}`,
      '',
      `[${$t('report.summary')}]`,
      report.summary || '',
      '',
      `[${$t('report.strengths')}]`,
      ...strengths.map((s, i) => `${i + 1}. ${s}`),
      '',
      `[${$t('report.weaknesses')}]`,
      ...weaknesses.map((w, i) => `${i + 1}. ${w}`),
      '',
      `[${$t('report.recommendations')}]`,
      ...recommendations.map((r, i) => `${i + 1}. ${r}`),
      '',
      `[${$t('report.practice')}]`,
      ...practiceQuestions.map((q, i) => `${i + 1}. ${q}`),
      '',
      `[${$t('report.notes')}]`,
      ...notes.map((n, i) => `${i + 1}. ${n}`)
    ].filter(Boolean);

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch (e) {
      console.warn('Failed to copy report to clipboard', e);
    }
  }

  async function handleCopyQuestion(text: string, index: number) {
    try {
      await navigator.clipboard.writeText(text);
      copiedQuestionIndex = index;
      setTimeout(() => {
        if (copiedQuestionIndex === index) copiedQuestionIndex = null;
      }, 1500);
    } catch (e) {
      console.warn('Failed to copy drill question', e);
    }
  }

  function formatDate(timestamp?: number): string {
    if (!timestamp) return '-';
    try {
      return new Date(timestamp).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return new Date(timestamp).toLocaleDateString();
    }
  }
</script>

{#if $isLoading || loadingData}
  <div class="min-h-screen bg-paper dark:bg-paper-dark flex items-center justify-center font-mono text-xs text-ink-muted uppercase tracking-widest">
    {$t('report.loading')}
  </div>
{:else}
  <div class="min-h-screen bg-paper dark:bg-paper-dark text-ink dark:text-ink-dark font-sans font-normal p-6 sm:p-12 lg:p-20 relative">
    <div class="max-w-3xl mx-auto w-full relative z-10">
      
      <!-- TOP NAVIGATION & ACTION BAR -->
      <nav class="flex justify-between items-center gap-4 mb-16 pb-4 border-b border-hairline dark:border-hairline-dark no-print">
        <a
          href="/"
          class="inline-flex items-center gap-2 text-xs font-mono text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark transition-colors uppercase tracking-wider px-2 py-1.5 rounded-xs focus:outline-none focus-visible:ring-1 focus-visible:ring-ink dark:focus-visible:ring-ink-dark"
          aria-label={$t('report.returnAria')}
        >
          <Icon name="arrow-left" size={14} />
          <span>{$t('report.return')}</span>
        </a>

        {#if report}
          <div class="flex items-center gap-3 text-xs font-mono">
            <button
              type="button"
              on:click={handleCopyFullReport}
              class="inline-flex items-center gap-1.5 text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark transition-colors px-2.5 py-1.5 rounded-xs focus:outline-none focus-visible:ring-1 focus-visible:ring-ink dark:focus-visible:ring-ink-dark"
              aria-label={$t('report.copyNotesAria')}
            >
              <Icon name={copied ? 'check' : 'copy'} size={14} class={copied ? 'text-green-600 dark:text-green-400' : ''} />
              <span>{copied ? $t('report.copied') : $t('report.copyNotes')}</span>
            </button>

            <button
              type="button"
              on:click={handlePrint}
              class="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover dark:bg-accent-dark dark:hover:bg-accent-dark-hover text-paper dark:text-paper-dark transition-colors rounded-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:focus-visible:ring-accent-dark"
              aria-label={$t('report.printAria')}
            >
              <Icon name="printer" size={15} />
              <span>{$t('report.print')}</span>
            </button>
          </div>
        {/if}
      </nav>

      {#if isDemo}
        <div class="mb-12 py-3 px-4 border border-hairline dark:border-hairline-dark bg-paper-surface dark:bg-paper-surface-dark flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs font-mono text-ink-muted dark:text-ink-muted-dark no-print">
          <span>{$t('report.demoBanner')}</span>
          <a href="/" class="inline-flex items-center gap-1 underline text-ink dark:text-ink-dark hover:opacity-80 px-1 py-0.5 rounded-xs focus:outline-none focus-visible:ring-1 focus-visible:ring-ink dark:focus-visible:ring-ink-dark">
            <span>{$t('report.startNewSession')}</span>
            <Icon name="arrow-right" size={13} />
          </a>
        </div>
      {/if}

      {#if !report}
        <!-- EMPTY STATE -->
        <div class="py-20 text-left space-y-4">
          <p class="text-sm font-mono text-ink-muted">
            {$t('report.emptyReport')}
          </p>
          <a href="/" class="inline-flex items-center gap-1.5 text-xs font-mono text-ink underline underline-offset-4 px-1 py-0.5 rounded-xs focus:outline-none focus-visible:ring-1 focus-visible:ring-ink dark:focus-visible:ring-ink-dark">
            <Icon name="arrow-left" size={14} />
            <span>{$t('report.return')}</span>
          </a>
        </div>
      {:else}

        <!-- HEADER SECTION -->
        <header class="mb-16 print-break-inside-avoid space-y-3">
          <span class="text-[10px] uppercase tracking-widest font-mono text-ink-faint dark:text-ink-faint-dark block">
            {$t('report.tag')}
          </span>
          <h1 class="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-ink dark:text-ink-dark leading-tight">
            {$t('report.title')}
          </h1>
          <p class="text-sm sm:text-base text-ink-muted dark:text-ink-muted-dark font-sans leading-relaxed pt-1">
            {$t('report.subtitle')}
          </p>

          <!-- CONTEXT METADATA -->
          <div class="pt-6 border-t border-hairline dark:border-hairline-dark flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-ink-faint dark:text-ink-faint-dark">
            {#if proposal?.title}
              <div class="truncate max-w-lg text-ink dark:text-ink-dark font-sans font-normal">
                {proposal.title}
              </div>
            {/if}
            <div>
              {formatDate(report.generatedAt || session?.createdAt)}
            </div>
          </div>
        </header>

        <!-- 01: ARGUMENT & DEFENSE REFLECTION (SUMMARY) -->
        <section class="mb-16 border-t border-hairline dark:border-hairline-dark pt-10 print-break-inside-avoid space-y-6">
          <h2 class="font-serif text-xl sm:text-2xl font-normal text-ink dark:text-ink-dark tracking-tight">
            {$t('report.summary')}
          </h2>

          <div class="font-serif text-base sm:text-lg text-ink dark:text-ink-dark leading-relaxed font-normal whitespace-pre-line">
            {report.summary}
          </div>

          <!-- Session focus note if interruptions occurred -->
          {#if session?.interruptions && session.interruptions > 0}
            <div class="pt-4 border-t border-hairline dark:border-hairline-dark text-xs font-mono text-ink-muted dark:text-ink-muted-dark">
              {$t('integrity.reportWarning').replace('{count}', session.interruptions.toString())}
            </div>
          {/if}

          <!-- Delivery Style & Articulation Notes -->
          {#if (report.notes || []).length > 0}
            <div class="pt-6 border-t border-hairline dark:border-hairline-dark space-y-3">
              <h3 class="text-xs uppercase tracking-widest font-mono text-ink-faint dark:text-ink-faint-dark">
                {$t('report.notes')}
              </h3>
              <ul class="list-none p-0 m-0 space-y-2.5">
                {#each report.notes || [] as note}
                  <li class="relative pl-5 before:content-['—'] before:absolute before:left-0 before:text-ink-faint text-sm text-ink-muted dark:text-ink-muted-dark leading-relaxed">
                    {note}
                  </li>
                {/each}
              </ul>
            </div>
          {/if}
        </section>

        <!-- 02: FOUNDATIONS & GROWTH AREAS (STRENGTHS & WEAKNESSES) -->
        <section class="mb-16 border-t border-hairline dark:border-hairline-dark pt-10 print-break-inside-avoid">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
            <!-- Strengths (Solid Foundations) -->
            <div class="space-y-4">
              <div class="border-b border-hairline dark:border-hairline-dark pb-2">
                <div class="flex items-center gap-2">
                  <Icon name="check-circle" size={18} class="text-ink dark:text-ink-dark shrink-0" />
                  <h3 class="font-serif text-lg font-normal text-ink dark:text-ink-dark">
                    {$t('report.strengths')}
                  </h3>
                </div>
                <p class="text-xs text-ink-faint dark:text-ink-faint-dark mt-1">
                  {$t('report.strengthsDesc')}
                </p>
              </div>

              <ul class="list-none p-0 m-0 space-y-3">
                {#each report.strengths || [] as strength}
                  <li class="flex items-start gap-2.5 text-sm text-ink-muted dark:text-ink-muted-dark leading-relaxed font-sans">
                    <Icon name="check" size={15} class="text-ink dark:text-ink-dark shrink-0 mt-0.5" />
                    <span>{strength}</span>
                  </li>
                {/each}
              </ul>
            </div>

            <!-- Weaknesses (Growth Areas) -->
            <div class="space-y-4">
              <div class="border-b border-hairline dark:border-hairline-dark pb-2">
                <div class="flex items-center gap-2">
                  <Icon name="alert-circle" size={18} class="text-ink dark:text-ink-dark shrink-0" />
                  <h3 class="font-serif text-lg font-normal text-ink dark:text-ink-dark">
                    {$t('report.weaknesses')}
                  </h3>
                </div>
                <p class="text-xs text-ink-faint dark:text-ink-faint-dark mt-1">
                  {$t('report.weaknessesDesc')}
                </p>
              </div>

              <ul class="list-none p-0 m-0 space-y-3">
                {#each report.weaknesses || [] as weakness}
                  <li class="flex items-start gap-2.5 text-sm text-ink-muted dark:text-ink-muted-dark leading-relaxed font-sans">
                    <Icon name="alert-triangle" size={15} class="text-ink-faint dark:text-ink-faint-dark shrink-0 mt-0.5" />
                    <span>{weakness}</span>
                  </li>
                {/each}
              </ul>
            </div>
          </div>
        </section>

        <!-- 03: ACTION PLAN TOWARDS DEFENSE -->
        <section class="mb-16 border-t border-hairline dark:border-hairline-dark pt-10 print-break-inside-avoid space-y-4">
          <div class="border-b border-hairline dark:border-hairline-dark pb-2">
            <h2 class="font-serif text-xl sm:text-2xl font-normal text-ink dark:text-ink-dark tracking-tight">
              {$t('report.recommendations')}
            </h2>
            <p class="text-xs text-ink-faint dark:text-ink-faint-dark mt-0.5">
              {$t('report.recommendationsDesc')}
            </p>
          </div>

          <ol class="list-none p-0 m-0 space-y-4 pt-2">
            {#each report.recommendations || [] as rec, i}
              <li class="flex items-baseline gap-4 pb-3 border-b border-hairline/60 dark:border-hairline-dark/60">
                <span class="font-mono text-xs text-ink-faint dark:text-ink-faint-dark shrink-0">
                  {(i + 1).toString().padStart(2, '0')}
                </span>
                <p class="text-sm text-ink-muted dark:text-ink-muted-dark leading-relaxed font-sans m-0">
                  {rec}
                </p>
              </li>
            {/each}
          </ol>
        </section>

        <!-- 04: SELF-PRACTICE DRILLS -->
        <section class="mb-24 border-t border-hairline dark:border-hairline-dark pt-10 print-break-inside-avoid space-y-4">
          <div class="border-b border-hairline dark:border-hairline-dark pb-2">
            <h2 class="font-serif text-xl sm:text-2xl font-normal text-ink dark:text-ink-dark tracking-tight">
              {$t('report.practice')}
            </h2>
            <p class="text-xs text-ink-faint dark:text-ink-faint-dark mt-0.5">
              {$t('report.practiceDesc')}
            </p>
          </div>

          <div class="space-y-4 pt-2">
            {#each report.practiceQuestions || [] as pq, i}
              <div class="flex items-baseline justify-between gap-4 pb-3 border-b border-hairline/60 dark:border-hairline-dark/60">
                <div class="flex items-baseline gap-4 min-w-0">
                  <span class="font-mono text-xs text-ink-faint dark:text-ink-faint-dark shrink-0">
                    {(i + 1).toString().padStart(2, '0')}
                  </span>
                  <p class="text-sm sm:text-base font-serif text-ink dark:text-ink-dark leading-relaxed m-0 font-normal">
                    {pq}
                  </p>
                </div>

                <button
                  type="button"
                  on:click={() => handleCopyQuestion(pq, i)}
                  class="no-print inline-flex items-center gap-1.5 shrink-0 text-xs font-mono text-ink-faint hover:text-ink dark:hover:text-ink-dark transition-colors px-2 py-1 rounded-xs focus:outline-none focus-visible:ring-1 focus-visible:ring-ink dark:focus-visible:ring-ink-dark"
                  aria-label={$t('report.copyQuestionAria')}
                  title={$t('report.copyQuestionTooltip')}
                >
                  <Icon name={copiedQuestionIndex === i ? 'check' : 'copy'} size={13} class={copiedQuestionIndex === i ? 'text-green-600 dark:text-green-400' : ''} />
                  <span>{copiedQuestionIndex === i ? $t('report.copied') : $t('report.copy')}</span>
                </button>
              </div>
            {/each}
          </div>
        </section>

      {/if}
    </div>
  </div>
{/if}
