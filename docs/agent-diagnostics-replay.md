# Agent diagnostics replay contract

## Scope
`xml-parser` exposes a deterministic replay artifact for agent debugging and replay checks.

## Public API
- `createXmlReplayContract(input, options?)`
- `verifyXmlReplayContract(input, expectedContract, options?)`

## Contract format
- `contract`: fixed value `xml-replay-v1`
- `sourceKind`: `string` | `bytes` | `document`
- `inputHash`: deterministic hash of the replay input shape
- `optionsHash`: deterministic hash of parse options used for replay
- `determinismHash`: parser determinism hash from the parsed document
- `events[]`: deterministic sequence of replay events
- `truncated`: true when `maxEvents` clipping was applied
- `replayHash`: deterministic hash of the full replay contract payload

## Event kinds
- `token`: tokenizer output record with stable span offsets
- `parse-error`: parse error taxonomy entry with offset/line/column
- `tree-node`: tree projection with node identity and source span
- `summary`: aggregate counts and determinism hash

## Determinism policy
- Stable input + stable options yields the same `replayHash`.
- `maxEvents` clipping is deterministic and always keeps a `summary` event.
- Cross-runtime parity is enforced by `reports/agent-diagnostics-replay.json`.

## Non-goals
- Browser rendering equivalence.
- Incremental replay of partially consumed stream state.
