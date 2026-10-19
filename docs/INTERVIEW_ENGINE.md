# Interview Engine

## State machine

```text
CREATED
  -> READY
  -> QUESTIONING
  -> WAITING_FOR_ANSWER
  -> EVALUATING
  -> FOLLOW_UP or NEXT_QUESTION
  -> COMPLETED
  -> REPORT_GENERATION
  -> REPORT_READY
```

The exact transition rules are application code, not model instructions.

## Question categories

- basic understanding
- methodology
- justification
- critical thinking
- scenario
- challenge
- clarification

## Adaptation

The current implementation now changes the difficulty deterministically from validated
answer scores: high averages increase it, low averages decrease it, and the value is
clamped to 1-5. Exact duplicate generated questions are replaced with a neutral
methodology prompt. Targeted follow-up topic selection remains future work.

## Session data

Track current state, question index, difficulty, transcript references, persisted answer
evaluations, timing where appropriate, and session-integrity events where implemented.
