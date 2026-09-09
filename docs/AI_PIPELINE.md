# AI Pipeline

## Proposal analysis
Input: extracted proposal text.

Output should be structured and validated:
- title
- research problem
- research questions
- objectives
- methodology
- scope/limitations
- risks/weaknesses
- likely defense topics

## Question generation
Use the proposal analysis, relevant proposal text, previous questions, previous answers, and current interview state. Avoid unsupported claims and repeated questions.

## Answer evaluation
Evaluate dimensions such as correctness, relevance, depth, justification, clarity, understanding, and critical thinking.

AI scores are practice feedback, not official academic grades.

## Follow-up logic
The application decides whether to ask a follow-up based on validated evaluation fields and deterministic interview rules. The model proposes content; application code controls transitions.
