# Development Workflow

1. Explore the relevant existing code and docs.
2. Plan non-trivial changes before editing.
3. Keep changes narrowly scoped.
4. Implement the smallest coherent change.
5. Run `bun run check` and relevant tests.
6. Run `bun run build` for changes affecting the production bundle.
7. Browser-test important user journeys.
8. Inspect the diff.
9. Update documentation if behavior/architecture changed.

## Definition of done

A feature is not done merely because it compiles. It should have appropriate error/loading/empty states, type safety, verification evidence, and documentation for meaningful architectural changes.
