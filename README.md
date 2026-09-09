**AI-based judgements thesis defense simulator thingy.**
A local-first, client-side thesis proposal defense simulator designed for static hosting.
## Architecture
```text
Astro + TypeScript
        |
        +--> Svelte interactive components
        |
        +--> Interview/domain logic
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
## Primary goals
1. Upload/read a thesis proposal in the browser.
2. Analyze it through a user-selected AI provider.
3. Run an adaptive text-based defense simulation.
4. Evaluate answers and generate a local report.
5. Keep user data local by default.
6. Keep the AI provider replaceable.
7. Make the entire application statically deployable.
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