# Local Data Model

This project has a browser database rather than a server database.

## IndexedDB stores

Suggested stores:

- `proposals`
- `proposalAnalyses`
- `interviewSessions`
- `interviewMessages`
- `answerEvaluations`
- `reports`
- `settings` only when data is too structured/large for localStorage

## localStorage

Use for small preferences such as theme, selected provider ID, selected model, and UI preferences. API-key handling must be explicit and documented; do not log values.

## Data lifecycle

Provide delete/reset behavior. Later, add export/import of all app data for portability.
