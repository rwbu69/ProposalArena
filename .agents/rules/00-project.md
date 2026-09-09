# Project Rules — Always On

- This is a static client-side application.
- Do not introduce a backend as an implicit dependency.
- Keep the architecture modular and understandable for a student project.
- Prefer simple browser-native solutions before adding infrastructure.
- Browser storage is the persistence layer for the MVP.
- AI is an external dependency and never owns application state.
- User content is untrusted input.
- User-provided API keys are secrets; never hardcode or log them.
- Keep the original thesis proposal immutable.
- Validate structured AI output before using it.
- Make changes narrowly scoped and verify them.
