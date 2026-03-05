# Parse XML With Namespaces

Goal: parse namespace-qualified XML and query by namespace URI.

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

Expected output:
- `0`
- `2`
- `h:item`
