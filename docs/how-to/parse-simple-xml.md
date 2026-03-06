# Parse Simple XML

## Goal
Parse a small XML document and inspect the deterministic document/root shape
that the parser returns.

## Prerequisites
- `@ismail-elkorchi/xml-parser` installed
- A well-formed XML string

## Copy/paste
```ts
import { parseXml, serializeXml } from "@ismail-elkorchi/xml-parser";

const document = parseXml("<invoice><line amount=\"10\"/></invoice>");

console.log(document.kind);
console.log(document.root?.qName);
console.log(document.errors.length);
console.log(serializeXml(document));
```

## Expected output
```txt
document
invoice
0
<invoice><line amount="10"/></invoice>
```

## Common failure modes
- Malformed input such as mismatched end tags or unterminated attributes causes
  parse diagnostics or throws on fatal conditions.
- Strict XML expectations are violated by HTML-like input with omitted closing
  tags.
- The caller ignores `document.errors`, which hides non-fatal parse problems.

## Related reference
- [Options](../reference/options.md)
- [Data model](../reference/data-model.md)
- [Error model](../reference/error-model.md)
