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

- Strong answer: may increase difficulty.
- Weak or incomplete answer: may trigger targeted follow-up.
- Repeated weakness: may revisit the topic.
- Duplicate detection: avoid asking the same question again.

## Session data

Track current state, question index, difficulty, transcript references, evaluations, timing where appropriate, and session-integrity events where implemented.
