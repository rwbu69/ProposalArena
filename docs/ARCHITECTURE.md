# Architecture

## Stack

- Astro for static pages/build/deployment.
- Svelte for interactive UI islands/components.
- TypeScript for application and domain code.
- IndexedDB for large local application data.
- localStorage for small preferences.
- Browser APIs for file/audio/focus functionality.
- External AI providers accessed directly from the browser with user-supplied credentials.

## Layers

### UI
Astro pages compose the application. Svelte components handle interactive state and events.

### Application/domain
The interview engine, proposal workflow, report generation coordination, and deterministic business rules live here.

### Storage
Repository-like modules hide IndexedDB implementation details from domain/UI code.

### AI
`AIProvider` is the stable application interface. Provider adapters translate normalized requests into provider-specific HTTP requests and normalize responses.

## Data flow

```text
User -> UI -> application service -> storage
                         |
                         +----------> AIProvider -> selected provider API
```

## Why no backend?
The MVP is intended to be free to host and easy to distribute. The tradeoff is that data is device-local, provider credentials are user-managed, and there is no cross-device synchronization.
