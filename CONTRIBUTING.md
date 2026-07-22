# Contributing

Open an issue for significant API or behavior changes before investing in an implementation. Bug fixes and focused maintenance changes can go directly to a pull request.

Keep runtime code dependency-free, ESM-only, and portable across Node.js, Deno, Bun, and browsers. Public breaking changes are acceptable before 1.0 when they remove ambiguity or runtime defects; do not add compatibility layers for obsolete contracts.

## Verify a change

Install Node.js 20 or newer, npm 10 or newer, and Deno:

```sh
npm ci
npm run check:fast
```

Parser, serializer, package, or cross-runtime changes also require Bun and Chromium:

```sh
npx playwright install chromium
npm run qualification:ci
```

Add the smallest regression test that fails without the change. Behavior tests belong in `test/`, compile-only API contracts in `type-tests/`, and fixed inputs in `test/fixtures/`. Do not commit generated `dist/` or `reports/` files.

See [development and releases](./docs/development.md) for the source layout and qualification suites.
