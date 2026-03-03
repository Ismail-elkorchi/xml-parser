# Release Validation Checklist

Run this sequence before release/publish decisions.

## Required checks

```bash
npm run lint
npm run typecheck
npm run build
npm run examples:run
npm test
npm run eval:release
```

## JSR dry-run

```bash
jsr publish --dry-run
```

## npm dry-runs

```bash
npm pack --dry-run
npm publish --dry-run
```

## Falsification probe

Run an independent canary parse + profile validation command outside the default suite.
