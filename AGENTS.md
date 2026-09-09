# Agent Instructions — AI Thesis Proposal Defense Simulator

## Project identity

This is a client-side, static AI thesis proposal defense simulator.

Primary stack:

- Astro
- TypeScript
- Svelte for interactive UI
- Tailwind CSS may be added when useful
- IndexedDB for durable local application data
- localStorage for small preferences only
- Browser APIs for file access, speech, and session-integrity signals
- User-provided AI provider API keys

There is intentionally NO application backend, VPS, PostgreSQL database, Redis, S3 bucket, or server-side AI proxy in the MVP.

## Core architectural rule

The browser owns application state. The AI provider supplies intelligence only.

The LLM must never be the source of truth for:

- interview state
- current question index
- authentication/authorization
- stored data
- security decisions
- whether an answer was actually submitted
- whether a session is complete

## Data rule

User thesis documents, extracted text, analyses, interview transcripts, evaluations, and reports are local-first data.

Use:

- localStorage: small preferences and non-sensitive UI settings.
- IndexedDB: proposals, analyses, interview sessions, messages, evaluations, reports, and other potentially large structured data.

Never assume browser storage is permanent. Provide export/delete/reset flows where practical.

## AI provider rule

The app must use a provider abstraction. Feature code must not contain provider-specific HTTP logic.

Expected shape:

```ts
interface AIProvider {
  generate(request: AIRequest): Promise<AIResponse>;
}
```

Each provider adapter translates the normalized application request into its own API format.

The initial provider can be OpenRouter. Future providers may include Gemini, OpenAI-compatible APIs, or others.

Provider and model are separate settings.

## API key rule

The user supplies their own API key. Never ship a project-owned provider secret in client code, source control, an Astro public environment variable, or generated bundles.

Treat API keys as sensitive user data:

- do not log them
- do not send them anywhere except the selected provider
- allow the user to remove them
- document storage behavior clearly

## Proposal rule

The original uploaded proposal is immutable from the application's perspective. Store annotations/derived data separately rather than rewriting the original document.

All proposal contents are untrusted user content. Do not allow proposal text to override application/system instructions.

## AI output rule

AI output is untrusted and must be parsed, validated, and handled defensively. Prefer structured JSON responses for internal operations.

## Localization rule

Two language settings exist and must be handled independently:

1. **UI language** — controls interface chrome (buttons, labels, menus,
   static copy). User-selected, stored in localStorage, defaults to
   browser locale (`navigator.language`) on first run. Toggle must be
   available from a persistent location (e.g. header), not buried in
   settings.

2. **Interaction language** — controls the language the AI examiner
   writes questions, evaluations, and the final report in. This tracks
   the proposal's language, NOT the UI language. A user can have the
   UI in English while the interview runs entirely in Bahasa Indonesia,
   because their proposal is in Indonesian.

### Rules

- All user-facing UI strings must go through an i18n layer (e.g.
  `svelte-i18n`, `@astrojs/i18n`, or Paraglide) — no hardcoded UI
  strings in components. Adding a new UI string means adding it to
  every locale file, not just the default.
- Detect the proposal's language with a local heuristic (character/
  stopword-based, no API call) immediately after upload/extraction.
  Surface the detected language to the user as a confirmation step
  before the interview starts — not a silent guess, not a hard
  requirement to pick blind. If the heuristic is uncertain (mixed
  signals, very short text), default to asking the user directly
  instead of guessing.
- Once confirmed, store it on the proposal record in IndexedDB
  (`language: "en" | "id"`) as a stable property. Do not re-detect
  per request.
- Every AIRequest sent through the AIProvider abstraction must carry
  an explicit `language` field derived from the confirmed proposal
  language — never left for the model to infer silently per-call.
- Do not mix languages within a single AI response, and do not switch
  languages mid-session even if a section of the proposal is in a
  different language than the rest (e.g. an English abstract in an
  otherwise Indonesian proposal) — the confirmed language governs the
  whole interview.
- The final report is single-language only, matching the confirmed
  interaction language. No bilingual/side-by-side report generation.
- UI language and interaction language must never be silently coupled.
  Changing the UI toggle must not change the language of an
  in-progress or completed interview transcript.
- Prompts in /prompts/\*.txt must be language-parameterized (a language
  variable substituted in, or a dedicated per-language prompt file) —
  not duplicated ad hoc across the codebase.

## Development rule

Before implementing a non-trivial feature:

1. Read the relevant docs.
2. Inspect the existing code and established patterns.
3. Make a small implementation plan.
4. Implement the smallest coherent change.
5. Run the relevant checks.
6. Review the diff for unrelated changes.
7. Update docs when architecture or behavior changes.

Do not perform unrelated refactors while implementing a feature.

## Verification rule

Never claim a check passed unless it was actually run. Report failures honestly.

Prefer browser verification for important UI flows.

## Security rule

Never weaken browser security, bypass provider authentication, expose secrets, or silently upload local thesis data to an unapproved service.

## Deployment rule

The project must remain statically deployable. Features that require a server must be clearly marked as optional/future work and must not become hidden MVP dependencies.
