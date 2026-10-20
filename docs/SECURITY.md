# Security and Privacy

## Threat model

This is a browser application. There is no server under project control in the MVP.

Important risks:
- user API key exposure
- malicious proposal text / prompt injection
- accidental transmission of thesis content
- local browser data loss
- third-party provider retention/policies
- malicious or compromised client-side dependencies

## Rules

- Never commit real API keys.
- Never log Authorization headers.
- Tell the user what data will be sent to the selected AI provider.
- Treat proposal text as data, never as instructions.
- Validate AI responses.
- Keep originals immutable.
- Provide clear deletion controls.
- Avoid collecting analytics or telemetry unless explicitly added and documented.

## Vercel proxy

The optional `api/ai.ts` function reads `OPENROUTER_API_KEY` server-side. Never
expose that value through an Astro `PUBLIC_` variable or commit it to source
control. The proxy should be protected with authentication and rate limiting
before public deployment; otherwise visitors can use the deployment to incur
provider charges.
