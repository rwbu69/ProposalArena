<script lang="ts">
  import '../../i18n/index';
  import { onMount } from 'svelte';
  import { dbStore } from '../../lib/db/database';
  import { normalizeDefenseReport } from '../../lib/ai/pipeline';
  import type { DefenseReport, InterviewSession, Proposal } from '../../types/domain';
  import { t, isLoading } from 'svelte-i18n';
  import { ArrowLeft, Printer, Copy, Check, FileText, Clock, AlertCircle } from 'lucide-svelte';

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
          report = allReports[0];
          id = report.id;
          if (id) {
            session = (await dbStore.getSession(id)) || null;
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
      ...practiceQuestions.map((p, i) => `${i + 1}. ${p}`),
    ];
    if (notes.length > 0) {
      lines.splice(6, 0, '', `[${$t('report.notes')}]`, ...notes.map((n, i) => `${i + 1}. ${n}`));
    }
    await navigator.clipboard.writeText(lines.join('\n'));
    copied = true;
    setTimeout(() => (copied = false), 2500);
  }

  async function handleCopyQuestion(text: string, index: number) {
    await navigator.clipboard.writeText(text);
    copiedQuestionIndex = index;
    setTimeout(() => {
      if (copiedQuestionIndex === index) copiedQuestionIndex = null;
    }, 2000);
  }

  function formatDate(timestamp?: number): string {
    if (!timestamp) return '-';
    try {
      return new Date(timestamp).toLocaleDateString(undefined, {
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
  <div class="min-h-screen bg-white dark:bg-space-left flex items-center justify-center font-sans">
    <div class="text-zinc-500 dark:text-space-textMuted font-mono text-xs uppercase tracking-widest animate-pulse">
      {$t('report.loading')}
    </div>
  </div>
{:else}
  <div class="min-h-screen bg-white dark:bg-space-left text-black dark:text-white font-sans font-light p-6 lg:p-16 relative">
    <div class="noise-bg"></div>

    <div class="max-w-[960px] mx-auto w-full relative z-10">
      
      <!-- TOP NAVIGATION & ACTION BAR -->
      <nav class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-14 pb-6 border-b border-zinc-200 dark:border-space-borderSoft no-print">
        <a
          href="/"
          class="group inline-flex items-center gap-2 text-zinc-500 dark:text-space-textMuted hover:text-black dark:hover:text-space-textHighlight transition-colors text-xs font-mono uppercase tracking-wider"
        >
          <ArrowLeft class="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>{$t('report.return')}</span>
        </a>

        {#if report}
          <div class="flex items-center gap-3">
            <button
              on:click={handleCopyFullReport}
              class="inline-flex items-center gap-2 px-3 py-1.5 border border-zinc-200 dark:border-space-borderSoft hover:border-black dark:hover:border-space-textSoft bg-zinc-50 dark:bg-space-viewer hover:bg-white dark:hover:bg-space-right text-zinc-600 dark:text-space-textSoft hover:text-black dark:hover:text-space-textHighlight text-xs font-mono tracking-wide transition-colors rounded-none"
              title={$t('report.copyNotes')}
            >
              {#if copied}
                <Check class="w-3.5 h-3.5 text-zinc-800 dark:text-space-textHighlight" />
                <span>{$t('report.copied')}</span>
              {:else}
                <Copy class="w-3.5 h-3.5" />
                <span>{$t('report.copyNotes')}</span>
              {/if}
            </button>

            <button
              on:click={handlePrint}
              class="inline-flex items-center gap-2 px-3.5 py-1.5 border border-zinc-200 dark:border-space-borderSoft hover:border-black dark:hover:border-space-textSoft bg-zinc-50 dark:bg-space-viewer hover:bg-white dark:hover:bg-space-right text-zinc-600 dark:text-space-textSoft hover:text-black dark:hover:text-space-textHighlight text-xs font-mono tracking-wide transition-colors rounded-none"
            >
              <Printer class="w-3.5 h-3.5" />
              <span>{$t('report.print')}</span>
            </button>
          </div>
        {/if}
      </nav>

      {#if isDemo}
        <div class="mb-10 p-4 border border-zinc-200 dark:border-space-border bg-zinc-50 dark:bg-space-viewer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs text-zinc-600 dark:text-space-textSoft no-print">
          <div class="flex items-center gap-2.5">
            <span class="w-2 h-2 rounded-full bg-zinc-400 dark:bg-space-textSoft shrink-0"></span>
            <span class="font-mono text-zinc-800 dark:text-space-textHighlight">
              Pratinjau Contoh: Belum ada sesi sidang proposal yang diselesaikan di browser ini. Menampilkan data evaluasi simulasi.
            </span>
          </div>
          <a
            href="/"
            class="shrink-0 text-xs font-mono uppercase tracking-wider text-black dark:text-space-textHighlight underline underline-offset-4 hover:opacity-75 transition-opacity"
          >
            Mulai Sidang Baru ↗
          </a>
        </div>
      {/if}

      {#if !report}
        <!-- EMPTY / LOADING STATE -->
        <div class="py-24 text-center">
          <p class="text-zinc-500 dark:text-space-textMuted text-sm font-mono tracking-wider">
            {$t('report.emptyReport')}
          </p>
          <div class="mt-6 flex justify-center items-center gap-4">
            <button
              on:click={() => { report = DEMO_REPORT; proposal = DEMO_PROPOSAL; isDemo = true; }}
              class="inline-flex items-center gap-2 px-4 py-2 border border-zinc-200 dark:border-space-border hover:border-black dark:hover:border-space-textHighlight bg-white dark:bg-space-viewer text-black dark:text-space-textHighlight text-xs font-mono tracking-wide transition-colors"
            >
              Lihat Contoh Catatan Bimbingan
            </button>
            <a
              href="/"
              class="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-black dark:text-space-textHighlight underline underline-offset-4"
            >
              {$t('report.return')}
            </a>
          </div>
        </div>
      {:else}

        <!-- HEADER SECTION -->
        <header class="mb-14 print-break-inside-avoid">
          <p class="text-zinc-500 dark:text-space-textMuted text-[10px] uppercase tracking-[0.25em] mb-3 font-mono font-medium">
            {$t('report.tag')}
          </p>
          <h1 class="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-black dark:text-space-textHighlight leading-tight">
            {$t('report.title')}
          </h1>
          <p class="text-zinc-600 dark:text-space-textSoft text-sm sm:text-base font-light mt-3 max-w-2xl leading-relaxed">
            {$t('report.subtitle')}
          </p>

          <!-- CONTEXT METADATA PILLS -->
          <div class="flex flex-wrap items-center gap-y-2 gap-x-6 mt-8 pt-6 border-t border-zinc-100 dark:border-space-borderSoft/60 text-xs text-zinc-500 dark:text-space-textMuted font-mono">
            {#if proposal?.title}
              <div class="inline-flex items-center gap-2">
                <FileText class="w-3.5 h-3.5 shrink-0" />
                <span class="truncate max-w-md text-zinc-700 dark:text-space-textSoft font-sans font-normal">
                  {proposal.title}
                </span>
              </div>
            {/if}
            <div class="inline-flex items-center gap-2">
              <Clock class="w-3.5 h-3.5 shrink-0" />
              <span>{formatDate(report.generatedAt || session?.createdAt)}</span>
            </div>
          </div>
        </header>

        <!-- 01: REFLEKSI SUBSTANSI (ARGUMENT REFLECTION) -->
        <section class="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 lg:gap-20 mb-20 items-start relative border-t border-zinc-200 dark:border-space-borderSoft pt-14 print-break-inside-avoid">
          <div class="lg:sticky lg:top-12">
            <span class="text-zinc-400 dark:text-space-textMuted font-mono text-xs mb-2 block tracking-wider">01</span>
            <h2 class="text-lg font-medium text-black dark:text-space-textHighlight leading-snug">
              {$t('report.summary')}
            </h2>
          </div>

          <div class="space-y-6">
            <!-- Narrative Summary -->
            <div class="prose prose-base sm:prose-lg dark:prose-invert max-w-none text-zinc-700 dark:text-space-textSoft font-light leading-relaxed whitespace-pre-line">
              <p>{report.summary}</p>
            </div>

            <!-- Focus / Integrity Notice (Framed constructively) -->
            {#if session?.interruptions && session.interruptions > 0}
              <div class="mt-6 flex items-start gap-3 p-4 border-l-2 border-zinc-300 dark:border-space-border bg-zinc-50 dark:bg-space-viewer text-xs text-zinc-600 dark:text-space-textSoft">
                <AlertCircle class="w-4 h-4 text-zinc-400 dark:text-space-textMuted shrink-0 mt-0.5" />
                <div>
                  <span class="font-medium text-zinc-800 dark:text-space-textHighlight block mb-0.5">
                    {$t('report.focusNotice')}
                  </span>
                  <span>{$t('integrity.reportWarning').replace('{count}', session.interruptions.toString())}</span>
                </div>
              </div>
            {/if}

            <!-- Delivery & Articulation Notes -->
            {#if (report.notes || []).length > 0}
              <div class="pt-6 border-t border-zinc-100 dark:border-space-borderSoft/40 mt-8">
                <h3 class="text-xs uppercase tracking-[0.2em] font-mono text-zinc-500 dark:text-space-textMuted mb-4 font-medium">
                  {$t('report.notes')}
                </h3>
                <ul class="list-none p-0 m-0 space-y-3">
                  {#each report.notes || [] as note}
                    <li class="relative pl-5 before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:bg-zinc-300 dark:before:bg-space-border text-sm text-zinc-700 dark:text-space-textSoft leading-relaxed font-light">
                      {note}
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}
          </div>
        </section>

        <!-- 02: EVALUASI DUA ARAH (STRENGTHS & GROWTH AREAS) -->
        <section class="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 lg:gap-20 mb-20 items-start relative border-t border-zinc-200 dark:border-space-borderSoft pt-14 print-break-inside-avoid">
          <div class="lg:sticky lg:top-12">
            <span class="text-zinc-400 dark:text-space-textMuted font-mono text-xs mb-2 block tracking-wider">02</span>
            <h2 class="text-lg font-medium text-black dark:text-space-textHighlight leading-snug">
              {$t('report.strengths')} & {$t('report.weaknesses')}
            </h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-12">
            <!-- Solid Foundations (Strengths) -->
            <div class="flex flex-col">
              <div class="mb-5 pb-3 border-b border-zinc-100 dark:border-space-borderSoft/60">
                <h3 class="text-xs uppercase tracking-[0.2em] font-mono text-zinc-500 dark:text-space-textMuted font-medium">
                  {$t('report.strengths')}
                </h3>
                <p class="text-[11px] text-zinc-400 dark:text-space-textMuted mt-1 font-light">
                  {$t('report.strengthsDesc')}
                </p>
              </div>

              <ul class="list-none p-0 m-0 space-y-4">
                {#each report.strengths || [] as strength}
                  <li class="relative pl-5 before:content-[''] before:absolute before:left-0 before:top-2.5 before:w-1.5 before:h-1.5 before:bg-black dark:before:bg-space-textHighlight text-sm text-zinc-700 dark:text-space-textSoft leading-relaxed font-light">
                    {strength}
                  </li>
                {/each}
              </ul>
            </div>

            <!-- Areas to Strengthen (Growth Opportunities) -->
            <div class="flex flex-col">
              <div class="mb-5 pb-3 border-b border-zinc-100 dark:border-space-borderSoft/60">
                <h3 class="text-xs uppercase tracking-[0.2em] font-mono text-zinc-500 dark:text-space-textMuted font-medium">
                  {$t('report.weaknesses')}
                </h3>
                <p class="text-[11px] text-zinc-400 dark:text-space-textMuted mt-1 font-light">
                  {$t('report.weaknessesDesc')}
                </p>
              </div>

              <ul class="list-none p-0 m-0 space-y-4">
                {#each report.weaknesses || [] as weakness}
                  <li class="relative pl-5 before:content-[''] before:absolute before:left-0 before:top-2.5 before:w-1.5 before:h-1.5 before:border before:border-zinc-400 dark:before:border-space-textSoft before:bg-transparent text-sm text-zinc-700 dark:text-space-textSoft leading-relaxed font-light">
                    {weakness}
                  </li>
                {/each}
              </ul>
            </div>
          </div>
        </section>

        <!-- 03: LANGKAH TINDAK LANJUT (ACTION PLAN TOWARDS DEFENSE) -->
        <section class="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 lg:gap-20 mb-20 items-start relative border-t border-zinc-200 dark:border-space-borderSoft pt-14 print-break-inside-avoid">
          <div class="lg:sticky lg:top-12">
            <span class="text-zinc-400 dark:text-space-textMuted font-mono text-xs mb-2 block tracking-wider">03</span>
            <h2 class="text-lg font-medium text-black dark:text-space-textHighlight leading-snug">
              {$t('report.recommendations')}
            </h2>
          </div>

          <div>
            <p class="text-xs text-zinc-400 dark:text-space-textMuted mb-6 font-mono">
              {$t('report.recommendationsDesc')}
            </p>

            <ol class="list-none p-0 m-0 space-y-5">
              {#each report.recommendations || [] as rec, i}
                <li class="flex items-start gap-5 p-4 border border-zinc-100 dark:border-space-borderSoft bg-zinc-50/50 dark:bg-space-viewer group transition-colors">
                  <span class="font-mono text-xs text-zinc-400 dark:text-space-textMuted shrink-0 pt-0.5 group-hover:text-black dark:group-hover:text-space-textHighlight transition-colors">
                    {(i + 1).toString().padStart(2, '0')}
                  </span>
                  <p class="text-sm text-zinc-700 dark:text-space-textSoft leading-relaxed font-light m-0">
                    {rec}
                  </p>
                </li>
              {/each}
            </ol>
          </div>
        </section>

        <!-- 04: LATIHAN PERTANYAAN MANDIRI (SELF-PRACTICE DRILLS) -->
        <section class="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 lg:gap-20 pb-28 items-start relative border-t border-zinc-200 dark:border-space-borderSoft pt-14 print-break-inside-avoid">
          <div class="lg:sticky lg:top-12">
            <span class="text-zinc-400 dark:text-space-textMuted font-mono text-xs mb-2 block tracking-wider">04</span>
            <h2 class="text-lg font-medium text-black dark:text-space-textHighlight leading-snug">
              {$t('report.practice')}
            </h2>
          </div>

          <div>
            <p class="text-xs text-zinc-400 dark:text-space-textMuted mb-6 font-mono">
              {$t('report.practiceDesc')}
            </p>

            <div class="space-y-4">
              {#each report.practiceQuestions || [] as pq, i}
                <div class="p-4 border border-zinc-200 dark:border-space-borderSoft bg-white dark:bg-space-viewer flex justify-between items-start gap-4 group hover:border-zinc-400 dark:hover:border-space-border transition-colors">
                  <div class="flex items-start gap-4 min-w-0">
                    <span class="font-mono text-xs text-zinc-400 dark:text-space-textMuted shrink-0 pt-0.5">
                      {(i + 1).toString().padStart(2, '0')}
                    </span>
                    <p class="text-sm text-zinc-800 dark:text-space-textHighlight leading-relaxed font-normal m-0">
                      {pq}
                    </p>
                  </div>

                  <button
                    on:click={() => handleCopyQuestion(pq, i)}
                    class="no-print shrink-0 p-1.5 text-zinc-400 hover:text-black dark:hover:text-space-textHighlight transition-colors"
                    title="Salin pertanyaan"
                  >
                    {#if copiedQuestionIndex === i}
                      <Check class="w-3.5 h-3.5 text-black dark:text-space-textHighlight" />
                    {:else}
                      <Copy class="w-3.5 h-3.5" />
                    {/if}
                  </button>
                </div>
              {/each}
            </div>
          </div>
        </section>

      {/if}
    </div>
  </div>
{/if}
