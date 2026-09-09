---
description: Add or modify an AI provider adapter while preserving the normalized provider abstraction and client-side security model.
---
# AI Provider

1. Read docs/PROVIDER_ARCHITECTURE.md and docs/SECURITY.md.
2. Define the provider's request/response mapping.
3. Keep provider-specific HTTP logic inside its adapter.
4. Normalize output into AIResponse.
5. Never log API keys or Authorization headers.
6. Handle non-2xx, malformed, empty, and rate-limit responses.
7. Add tests/fixtures.
8. Update provider documentation.

The rest of the application should not need to know the provider's wire format.
