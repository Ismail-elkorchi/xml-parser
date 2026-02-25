# ADR-003: Browser smoke runtime evidence

## Status
Accepted

## Context
`xml-parser` claims multi-runtime support. Node, Deno, and Bun smoke checks were already enforced in CI, but browser runtime evidence was not explicitly provisioned in CI workflows.

## Decision
- Require browser smoke report `reports/browser-smoke.json` in CI and release evaluation profiles.
- Execute browser smoke in CI using Playwright Chromium with explicit setup:
  - `npx playwright install --with-deps chromium`
- Keep browser smoke evaluation deterministic and report-backed.

## Consequences
- Runtime support claims are backed by executable browser evidence in CI.
- CI runtime coverage now includes Node, Deno, Bun, and browser smoke.
- Browser setup cost increases CI runtime, but avoids unverifiable runtime claims.
