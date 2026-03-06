# Troubleshoot Malformed XML

## Goal
Understand how malformed XML surfaces through `document.errors` and when to
stop processing versus continue with diagnostics.

## Prerequisites
- `@ismail-elkorchi/xml-parser` installed
- XML input that may contain syntax problems

## Copy/paste
```ts
import { parseXml } from "@ismail-elkorchi/xml-parser";

const malformed = "<root><item></root>";
const document = parseXml(malformed, {
  strict: true,
  budgets: {
    maxInputBytes: 4_096,
    maxNodes: 128,
    maxDepth: 16,
    maxErrors: 8
  }
});

console.log(document.kind);
console.log(document.errors.length > 0);
console.log(document.errors[0]?.parseErrorId);
```

## Expected output
```txt
document
true
mismatched-end-tag
```

## Common failure modes
- The caller ignores `document.errors` and assumes the tree is fully trustworthy.
- `maxErrors` is too low for troubleshooting, so diagnostics stop before the
  useful failure is reported.
- HTML-like recovery expectations are applied to XML input; XML keeps stricter
  malformed-input behavior.

## Related reference
- [Error model](../reference/error-model.md)
- [Options](../reference/options.md)
- [Data model](../reference/data-model.md)
