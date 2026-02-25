# Security baseline

## Runtime policy
- No runtime dependencies.
- Runtime source under `src/` must not import Node builtins.

## XML policy
- DTD and external entities are disabled by default.
- External entity processing requires explicit opt-in flags.
- Budget limits are mandatory for bytes, nodes, depth, errors, and parse time.
- Budget overruns fail with structured `XmlBudgetExceededError`.

## CI security workflows
- CodeQL on pull requests and pushes to `main`.
- Dependency review on pull requests.
- OpenSSF Scorecard on push to `main` and workflow dispatch.
- Browser runtime smoke is executed in CI with Playwright Chromium.
- Browser smoke evidence is required in `eval:ci` and `eval:release` via `reports/browser-smoke.json`.
