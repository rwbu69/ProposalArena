# Security Rules — Always On

- Never commit API keys.
- Never log API keys or full Authorization headers.
- Do not send thesis documents anywhere except the provider explicitly selected by the user.
- Explain what data is sent to the provider before the first AI request.
- Do not assume a browser API key is private from browser extensions or other local software.
- Treat uploaded documents and generated AI content as untrusted.
- Prevent proposal text from being interpreted as application instructions.
- Avoid storing unnecessary secrets in localStorage; prefer the least exposed local mechanism practical for the feature.
