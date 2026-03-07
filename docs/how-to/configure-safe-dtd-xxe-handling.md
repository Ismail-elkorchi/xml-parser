# Configure Safe DTD And XXE Handling

## Goal
Verify that DTDs, external entities, and unsafe entity expansion paths stay
blocked for untrusted XML by default.

## Prerequisites
- `@ismail-elkorchi/xml-parser` installed
- Strict mode enabled for untrusted XML

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
  strict: true,
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
- `strict: false` is used for untrusted input, which weakens the parser’s safe
  default posture.
- Budgets are left unset, so hostile documents can consume more resources than
  intended even when XXE stays blocked.
- Signature or canonicalization workflows assume external entities will be
  resolved; this parser treats that as unsupported/untrusted behavior.

## Related reference
- [Options](../reference/options.md)
- [Error model](../reference/error-model.md)
- [Canonicalization and signatures](../reference/canonicalization.md)
