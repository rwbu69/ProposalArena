# Architecture Rules — Always On

## Target architecture
Astro static site -> Svelte interactive islands/components -> application services -> browser storage and external AI provider APIs.

There is no server-side application in the MVP.

## Layer boundaries
- UI components: render state and collect user interaction.
- Application services: coordinate proposal analysis, interviews, reports, and provider calls.
- Domain logic: deterministic interview state transitions and rules.
- Storage layer: IndexedDB/localStorage access only.
- AI layer: normalized provider interface + provider-specific adapters.

UI code must not directly call provider-specific endpoints.
Feature/domain code must not directly manipulate IndexedDB internals.

## Provider abstraction
Use a normalized interface so the interview engine can use any supported provider without knowing request formats.

## Static deployment
Do not add server endpoints, SSR-only assumptions, server secrets, or runtime infrastructure to the MVP.
