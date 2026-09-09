# Architecture Decisions

## ADR-001 — Static client-side MVP

**Decision:** The MVP will be a statically deployed browser application.

**Why:** Removes VPS/server/database cost and reduces implementation complexity. User data can remain local by default.

**Tradeoffs:** No synchronization across devices, browser storage can be cleared, and external AI providers remain required for AI functionality.

## ADR-002 — Provider abstraction

**Decision:** The application depends on a normalized `AIProvider` interface, not a specific AI vendor.

**Why:** Users may choose different providers, and each provider may expose different APIs.

## ADR-003 — Svelte with Astro

**Decision:** Astro owns static routing/build; Svelte owns highly interactive UI islands.

**Why:** The application has substantial local UI state but does not require a full server-rendered application framework.

## ADR-004 — IndexedDB for main local persistence

**Decision:** Use IndexedDB for proposals, interviews, and reports; reserve localStorage for small preferences.

**Why:** Thesis content and transcripts can exceed comfortable localStorage usage patterns.
