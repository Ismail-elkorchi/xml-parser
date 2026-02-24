# Contributing

## Workflow
- Pull requests only.
- Use small, logically scoped changes.
- Merge via squash.

## Local verification
Run before opening a pull request:
- `npm ci`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm test`
- `npm run eval:ci`

## Constraints
- Runtime dependencies must remain empty.
- ESM only.
- Runtime code under `src/` must not import Node builtins.
- Evaluation artifacts are written under `reports/` and not committed.
