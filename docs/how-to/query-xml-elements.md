# Query XML Elements

Goal: locate XML elements by qName and attributes.

```ts
import { findFirstElementByQName, listElementsByAttribute, parseXml } from "@ismail-elkorchi/xml-parser";

const document = parseXml("<root><item id=\"a\"/><item id=\"b\"/></root>");

const first = findFirstElementByQName(document, "item");
const all = listElementsByAttribute(document, "id", "b");

console.log(first?.qName, all.length);
```

Expected output:
- Deterministic element traversal order and query results.
