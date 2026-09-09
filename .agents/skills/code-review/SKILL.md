---
description: Review changes for correctness, architecture, security, reliability, testing, scope, maintainability, and documentation.
---
# Code Review

Check:
- static deployment remains possible
- no backend dependency was introduced accidentally
- no provider-specific API logic leaked into the application layer
- API keys are not exposed in source or logs
- user content is treated as untrusted
- AI output is validated
- interview state remains application-owned
- tests and build evidence are honest
- documentation matches implementation

Classify findings as BLOCKER, MAJOR, MINOR, or NOTE.
