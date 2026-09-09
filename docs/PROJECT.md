# Project Definition

## Problem
Students preparing for thesis proposal defenses often need practice answering questions that are specific to their own proposal.

## Product
A browser-based simulator that acts as an AI examiner. The simulator reads a thesis proposal, generates questions, evaluates answers, adapts follow-up questions, and produces a practice report.

## Target user
A student preparing for a thesis proposal defense.

## Core workflow

Upload proposal -> extract text -> analyze proposal -> start defense -> answer questions -> evaluate/adapt -> finish -> generate report -> save locally.

## Principles

- Local-first.
- Static deployability.
- Modular TypeScript.
- AI-provider agnostic application layer.
- Deterministic state machine controlled by application code.
- Original proposal remains immutable.
- AI feedback is preparation guidance, not an official academic grade.
