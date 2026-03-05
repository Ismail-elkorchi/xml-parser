# Parse Simple XML

Goal: parse XML text and inspect deterministic document output.

```ts
import { parseXml, serializeXml } from "@ismail-elkorchi/xml-parser";

const document = parseXml("<invoice><line amount=\"10\"/></invoice>");

console.log(document.kind);
console.log(document.root?.qName);
console.log(serializeXml(document));
```

Expected output:
- `document`
- `invoice`
- `<invoice><line amount="10"/></invoice>`
