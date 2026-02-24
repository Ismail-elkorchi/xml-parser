# Security baseline

## Runtime policy
- No runtime dependencies.
- Runtime source under `src/` must not import Node builtins.

## XML policy (bootstrap)
- DTD and external entities are disabled by default in planned parser behavior.
- Entity expansion limits are required before release profile hardening.

## CI security workflows
- CodeQL on pull requests and pushes to `main`.
- Dependency review on pull requests.
- OpenSSF Scorecard on push to `main` and workflow dispatch.
