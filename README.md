# ProposalArena — Simulator Sidang Proposal Skripsi Berbasis AI

**ProposalArena** adalah aplikasi simulasi sidang proposal skripsi interaktif yang dirancang dengan arsitektur *local-first*. Mahasiswa dapat mengunggah naskah proposal PDF, berlatih menghadapi pertanyaan kritis dosen penguji AI baik lewat **teks maupun suara (*live voice / hands-free*)**, serta memperoleh laporan evaluasi terstruktur yang siap dicetak ke PDF.

---

## Alur Simulasi

```text
Upload PDF (Maks. 10 MB)
   │
   ▼
Deteksi & Konfirmasi Bahasa (ID / EN)
   │
   ▼
Analisis Proposal Otomatis (Struktur, Metodologi, Celah Riset)
   │
   ▼
Briefing & Pemilihan Timer (Tanpa Timer / 15 / 20 / 30 Menit)
   │
   ▼
Sesi Sidang Interaktif (Maks. 10 Pertanyaan — Teks / Suara / Hands-Free)
   │
   ▼
Laporan Evaluasi & Skor Rubrik (/report — Salin Catatan & Cetak PDF)
```

---

## Fitur Utama

1. **Ekstraksi & Grounding Dokumen Lokal (`pdfjs-dist` + `MiniSearch`)**
   - Naskah PDF dibaca langsung di browser dan diindeks secara lokal menggunakan `MiniSearch` untuk melakukan *Client-Side RAG*, sehingga pertanyaan penguji berakar pada isi proposal yang diunggah.
2. **Penguji AI Adaptif & Evaluasi 5 Rubrik**
   - Pipeline AI (`src/lib/ai/pipeline.ts`) membagi proses menjadi tahap *Analysis*, *Examine*, *Evaluate*, dan *Report*.
   - Setiap jawaban dinilai pada 5 kriteria (*Correctness*, *Relevance*, *Depth*, *Justification*, dan *Clarity*) skala 1–5 yang menyesuaikan tingkat kesulitan pertanyaan berikutnya secara dinamis.
3. **Mode Suara & *Hands-Free* Bahasa Indonesia**
   - **Text-to-Speech (TTS)**: Menggunakan Google Gemini TTS (`gemini-2.5-flash-preview-tts` dengan fallback `gemini-3.8-flash-lite-tts` dan Web Speech API) serta sinkronisasi agar teks pertanyaan dan audio penguji muncul bersamaan.
   - **Speech-to-Text (STT)**: Menggunakan Groq Whisper (`whisper-large-v3`) melalui `/api/stt` baik untuk dikte manual maupun *Hands-Free Mode* (dilengkapi deteksi jeda suara otomatis via `AudioContext`).
4. **Pemantauan Integritas & Timer Sidang**
   - Mendeteksi perpindahan tab atau hilangnya fokus jendela (`IntegrityMonitor.svelte`) dan mencatatnya di laporan akhir.
   - Timer sidang otomatis mengakhiri sesi dan menyusun laporan ketika waktu habis atau setelah pertanyaan ke-10 selesai.
5. **Laporan Evaluasi & Ekspor PDF (`/report`)**
   - Menampilkan ringkasan skor (0–100 dan 1–5), refleksi penguasaan materi, kekuatan, kelemahan, *action plan*, *drill questions*, tombol salin, serta dukungan cetak PDF (`Print / Save as PDF`).
6. **Penyimpanan Lokal-Pertama (*Local-First*)**
   - Seluruh proposal, transkrip, evaluasi, dan laporan disimpan di **IndexedDB** browser pengguna, dengan fitur **Export Data (JSON)** dan **Reset Data Lokal** di menu Pengaturan.
7. **Dwibahasa Independen (UI & Interaksi)**
   - Bahasa antarmuka (`ID` / `EN`) dapat diganti kapan saja di header tanpa mengubah bahasa sesi wawancara yang sudah dikonfirmasi dari proposal.

---

## Arsitektur & Tech Stack

```text
Astro (Static) + Svelte + TypeScript + Tailwind CSS
   ├── Storage Lokal
   │     ├── IndexedDB (proposals, analyses, sessions, messages, evaluations, reports, judgments)
   │     └── localStorage (bahasa UI, tema, preferensi suara, settings)
   ├── Domain & AI Pipeline
   │     ├── PDF Extractor & Language Detector (src/lib/file/extractor.ts)
   │     ├── Client-Side RAG Indexer (src/lib/search/indexer.ts)
   │     ├── Interview State Machine & Controller (src/lib/interview/)
   │     └── Voice Engine: TTS & Groq Whisper STT (src/lib/voice/)
   └── Serverless Proxy (Vercel Functions / Vite Dev Middleware)
         ├── /api/ai  ──► Google Gemini (gemini-3.5-flash-lite)
         ├── /api/tts ──► Google Gemini TTS (gemini-2.5-flash-preview-tts)
         └── /api/stt ──► Groq Whisper (whisper-large-v3)
```

---

## Menjalankan Secara Lokal

### 1. Prasyarat
- **Node.js** v20+ (direkomendasikan v22+)
- **Google Gemini API Key** dari [Google AI Studio](https://aistudio.google.com/)
- **Groq API Key** dari [Groq Console](https://console.groq.com/) *(untuk fitur STT / dikte & hands-free suara)*

### 2. Instalasi & Konfigurasi
```bash
npm install
cp .env.example .env
```

Isi file `.env` Anda:
```env
PUBLIC_AI_PROXY_URL=/api/ai
GEMINI_API_KEY=isi_gemini_api_key_anda
GROQ_API_KEY=isi_groq_api_key_anda
GEMINI_MODEL=gemini-3.5-flash-lite
```

### 3. Perintah Pengembangan & Verifikasi
```bash
# Menjalankan server pengembangan lokal (http://localhost:4321)
npm run dev

# Pemeriksaan tipe TypeScript & komponen Astro/Svelte
npm run check

# Build produksi static ke folder dist/
npm run build
```

---

## Deployment ke Vercel

Proyek ini sudah dilengkapi konfigurasi [vercel.json](file:///d:/proposalarena/vercel.json) dan *serverless functions* pada folder `api/` (`api/ai.ts`, `api/tts.ts`, `api/stt.ts`).

1. Hubungkan repositori ke proyek Vercel baru.
2. Pada **Project Settings → Environment Variables**, tambahkan:
   - `PUBLIC_AI_PROXY_URL` = `/api/ai`
   - `GEMINI_API_KEY` = *(API key Gemini Anda — **jangan** gunakan prefix `PUBLIC_`)*
   - `GROQ_API_KEY` = *(API key Groq Anda — **jangan** gunakan prefix `PUBLIC_`)*
   - `GEMINI_MODEL` = `gemini-3.5-flash-lite` *(opsional)*
3. Lakukan **Deploy / Redeploy** agar `PUBLIC_AI_PROXY_URL` ikut terbaca saat proses `astro build`.

---

## Privasi & Keamanan

- **API Key Aman di Server**: Saat menggunakan mode proxy (`/api/ai`, `/api/tts`, `/api/stt`), seluruh kredensial disimpan di environment variable server dan tidak pernah disertakan ke dalam bundle JavaScript client.
- **Data Tetap di Browser**: Dokumen proposal, transkrip, dan laporan tersimpan lokal di IndexedDB browser Anda dan hanya dikirim ke penyedia AI terkait saat fitur analisis/sidang/suara dijalankan.
