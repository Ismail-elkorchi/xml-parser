# Threat Model

## Threat classes
- XXE and external entity expansion (CWE-611)
- Exponential or oversized entity expansion and parser blowup (CWE-776)
- Resource exhaustion via input size/depth/node count/time (CWE-400)

## Security defaults
- DTD declarations are always rejected.
- External entity declarations are always rejected.
- Runtime budgets are enforced for:
  - `maxInputBytes`
  - `maxStreamBytes`
  - `maxNodes`
  - `maxDepth`
  - `maxAttributesPerElement`
  - `maxTextBytes`
  - `maxErrors`
  - `maxTimeMs`

## Out-of-scope mitigations
- Network sandboxing for URI fetch is out of parser scope.
- Host-level file/network permissions are caller responsibilities.
