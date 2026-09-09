# Frontend Rules — Apply to frontend files

- Use TypeScript strictness.
- Prefer Svelte for stateful interactive components.
- Keep Astro pages responsible for page composition; keep reusable interaction in Svelte components.
- Avoid unnecessary state duplication.
- Every async UI needs loading, error, empty, and retry states where applicable.
- Keep keyboard accessibility and readable focus states.
- Clearly distinguish user text, AI text, system events, and monitoring notices.
- Voice features must have a text fallback.
- Proposal annotations are derived overlays; never mutate the original proposal content.
