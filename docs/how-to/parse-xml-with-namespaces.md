# Parse XML With Namespaces

## Goal
Parse namespace-qualified XML and query by namespace URI instead of guessing
from prefixes alone.

## Prerequisites
- `@ismail-elkorchi/xml-parser` installed
- An XML document with namespace declarations

## Copy/paste
```ts
import { listElementsByNamespace, parseXml } from "@ismail-elkorchi/xml-parser";

const xml = `
  <root xmlns:h="http://example.com/h">
    <h:item id="a"/>
    <h:item id="b"/>
  </root>
`;

const document = parseXml(xml);
const items = listElementsByNamespace(document, "http://example.com/h");

console.log(document.errors.length);
console.log(items.length);
console.log(items[0]?.qName);
```

## Expected output
```txt
0
2
h:item
```

## Common failure modes
- Prefix-based matching is used instead of namespace-URI matching, which breaks
  as soon as a prefix changes.
- The namespace declaration is missing or malformed, so the query returns no
  matches.
- Downstream code assumes canonicalization preserves author-chosen prefixes; it
  preserves namespace semantics, not presentation choices.

## Related reference
- [Data model](../reference/data-model.md)
- [Canonicalization and signatures](../reference/canonicalization.md)
- [Error model](../reference/error-model.md)
