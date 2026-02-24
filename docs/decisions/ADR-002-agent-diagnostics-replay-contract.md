# ADR-002: Agent diagnostics replay contract

## Status
Accepted

## Context
`xml-parser` exposes deterministic parsing, query, schema, and canonicalization surfaces. Agents still need a replay artifact that can be persisted and compared across Node, Deno, and Bun to debug parse outcomes without depending on runtime-local traces.

## Decision
- Add public replay APIs:
  - `createXmlReplayContract(input, options?)`
  - `verifyXmlReplayContract(input, expectedContract, options?)`
- Define replay contract version `xml-replay-v1`.
- Include stable event kinds (`token`, `parse-error`, `tree-node`, `summary`) and a deterministic `replayHash`.
- Enforce cross-runtime replay hash equality through gate `G-062` with report `reports/agent-diagnostics-replay.json`.

## Consequences
- Agents get a machine-stable replay payload for diagnostics and regression triage.
- CI and release profiles fail if replay parity drifts across runtimes or if replay APIs/docs are missing.
- Replay payload is structural diagnostics, not execution tracing of parser internals.
