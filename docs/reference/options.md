# Options

## Parse options

### `strict`
- Type: `boolean`
- Default: `true`
- Enforces strict XML well-formedness behavior.

### `budgets`
- `maxInputBytes`
- `maxStreamBytes`
- `maxNodes`
- `maxDepth`
- `maxAttributesPerElement`
- `maxErrors`

## Validation options

### `validateXmlProfile(document, profile)`
- `expectedRootQName`
- `requiredElementQNames`
- `requiredAttributes`

## Replay options

### `createXmlReplayContract(document, options?)`
- Controls emitted replay scope and event selection.

### `verifyXmlReplayContract(contract, options?)`
- Controls strictness and mismatch handling.
