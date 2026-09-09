**AI-based judgements thesis defense simulator thingy.**
A local-first, client-side thesis proposal defense simulator designed for static hosting.
## Architecture
```text
Astro + TypeScript
        |
        +--> Svelte interactive components (with Tailwind CSS)
        |
        +--> Interview/domain logic
        |      +--> i18n (Multi-language Support)
        |      +--> Session Integrity Monitoring
        |      +--> Voice (Speech-to-Text & Text-to-Speech)
        |
        +--> Browser storage
        |      +--> localStorage (small settings)
        |      +--> IndexedDB (proposals, sessions, reports)
        |
        +--> AI provider abstraction
               +--> OpenRouter adapter (initial)
               +--> future providers
```
There is intentionally no application server or database server in the MVP.
## Primary features & goals
1. Upload/read a thesis proposal in the browser.
2. Analyze it through a user-selected AI provider.
3. Run an adaptive text-based or voice-enabled defense simulation.
4. Monitor session integrity (e.g., tab switching/focus loss).
5. Support multiple languages for UI and interaction.
6. Evaluate answers and generate a local report.
7. Keep user data local by default using IndexedDB.
8. Keep the AI provider replaceable.
9. Make the entire application statically deployable.
## AI Simulation Techniques

To ensure the LLM behaves as a realistic and rigorous examiner, the following techniques are integrated into the AI pipeline (`src/lib/ai/pipeline.ts` and `src/prompts/`):

1. **Multi-stage Pipeline**: The interaction is broken down into specific AI tasks rather than relying on one giant prompt.
   - *Analysis*: The proposal is first analyzed into structured JSON (objectives, methodology, limitations) at a low temperature (`0.1`) to establish facts.
   - *Examine*: Question generation runs at a higher temperature (`0.7`) for dynamic adaptation.
   - *Evaluate*: Each student answer is individually graded (1-5 on depth, relevance, clarity) to build the final report.
   - *Report*: A final summary call extracts strengths, weaknesses, and recommendations based on the whole transcript.
2. **Context Grounding (RAG)**: Uses a client-side search index (`minisearch`) to retrieve relevant chunks from the thesis text based on the conversation history, anchoring the examiner's questions in the actual document to prevent hallucination.
3. **Rolling Transcript Memory**: The LLM is fed a sliding window of the most recent transcript exchanges (e.g., last 6 messages) to maintain context and ask adaptive follow-up questions without exceeding context limits.
4. **Strict Persona & Guardrails**: The examiner prompt strictly forbids pleasantries, compound questions, or breaking character. It includes explicit guardrails to refuse "tutoring" requests or summarizing the student's work for them.
5. **Adaptive Difficulty**: A difficulty scalar (1-5) is explicitly injected into the prompt, guiding the LLM from basic clarification questions up to challenging the feasibility and trade-offs of the chosen methodology.

## Non-goals for the MVP
- VPS/backend deployment
- PostgreSQL/Redis/S3
- centralized authentication
- project-owned AI API credentials
- server-side document storage
- server-side AI proxy
## Development
```bash
bun install
bun run dev
```
Checks:
```bash
bun run check
bun run build
```
## Important privacy model
The user provides their own provider API key. The app must never contain a shared project secret. Thesis text may be transmitted to the selected provider when an AI feature is used; the UI should explain this before sending data.
## Agent guidance
Read `AGENTS.md` first. Then read the relevant files in `docs/` and `.agents/` before implementing substantial work.