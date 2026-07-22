# Development and releases

## Source layout

- `src/contracts/` owns the public data and error contracts shared by all layers.
- `src/internal/` contains tokenization, namespace-aware tree construction, budgets, and serialization internals.
- `src/public/` contains query and structural-profile helpers.
- `src/mod.ts` is the only package API facade; `jsr/mod.ts` re-exports the same source graph.
- `test/` contains behavior tests and fixed conformance/security inputs.
- `type-tests/` contains compile-only public TypeScript contracts.
- `scripts/qualification/` contains conformance, fuzz, browser, cross-runtime, performance, oracle, and packed-package checks.

Runtime source has no dependencies and does not import Node.js built-ins. Development tools are exact-version dev dependencies.

## Local checks

Install Node.js 20 or newer, npm 10 or newer, and Deno, then run:

```sh
npm ci
npm run check:fast
```

Full qualification also requires Bun and Playwright Chromium:

```sh
npx playwright install chromium
npm run qualification:ci
```

`qualification:release` additionally compares applicable fixtures with an independent Python XML parser. Generated evidence is written to ignored files under `reports/`.

The build starts from an empty `dist/`, rewrites emitted declaration imports for Node consumers, and tests the packed npm artifact in an isolated JavaScript and TypeScript consumer.

## Releases

Registry publishing is intentionally release-only. Update `package.json` and `jsr.json` to the same version, update `CHANGELOG.md`, merge the change to `main`, tag that exact commit as `vX.Y.Z`, and publish a GitHub release for the tag.

The publish workflow verifies tag/version/main ancestry, runs full release qualification for the checked-out tag, dry-runs JSR with Deno, and publishes that source to JSR plus the exact npm tarball it generated. There is no arbitrary-ref or manual publish path.
