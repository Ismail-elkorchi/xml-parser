# Eval report format

All evaluation artifacts are written under `reports/`.

## `no-runtime-deps.json`
- `suite`: `no-runtime-deps`
- `timestamp`: ISO timestamp
- `ok`: boolean
- `dependencies`: string[]

## `no-node-builtins.json`
- `suite`: `no-node-builtins`
- `timestamp`: ISO timestamp
- `ok`: boolean
- `violations`: `{ file, specifier }[]`

## `gates.json`
- `suite`: `gates`
- `timestamp`: ISO timestamp
- `profile`: `ci|release`
- `ok`: boolean
- `checks`: `{ gate, ok, details }[]`

## `eval-summary.json`
- `suite`: `eval-summary`
- `timestamp`: ISO timestamp
- `profile`: `ci|release`
- `ok`: boolean
- `reports`: string[]
