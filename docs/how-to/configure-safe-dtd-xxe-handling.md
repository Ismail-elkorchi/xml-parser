# Configure Safe DTD And XXE Handling

## Goal
Verify that DTDs, external entities, and unsafe entity expansion paths stay
blocked for untrusted XML by default.

## Prerequisites
- `@ismail-elkorchi/xml-parser` installed
- Parse budgets selected for untrusted XML

## Copy/paste
```ts
import { parseXml } from "@ismail-elkorchi/xml-parser";

const untrusted = `
<!DOCTYPE root [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<root>&xxe;</root>
`;

const document = parseXml(untrusted, {
  budgets: {
    maxInputBytes: 16_384,
    maxNodes: 1_024,
    maxDepth: 64,
    maxErrors: 16
  }
});

const errorIds = document.errors.map((error) => error.parseErrorId);
console.log(errorIds.includes("disallowed-dtd"));
console.log(errorIds.includes("disallowed-external-entity"));
```

## Expected output
```txt
true
true
```

## Common failure modes
- Parse diagnostics are ignored after DTD or external-entity declarations are
  rejected.
- Budgets are left unset, so hostile documents can consume more resources than
  intended even when XXE stays blocked.
- Signature or canonicalization workflows assume external entities will be
  resolved; this parser treats that as unsupported/untrusted behavior.

## Related reference
- [Options](../reference/options.md)
- [Error model](../reference/error-model.md)
- [Canonicalization and signatures](../reference/canonicalization.md)
