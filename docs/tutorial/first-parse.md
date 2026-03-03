# First Parse Walkthrough

This tutorial shows the baseline workflow for deterministic XML parsing.

## 1. Parse XML text

```ts
import { parseXml, serializeXml } from "@ismail-elkorchi/xml-parser";

const document = parseXml("<root><item id=\"1\">ok</item></root>");
console.log(serializeXml(document));
```

## 2. Parse bytes

```ts
import { listElementsByQName, parseXmlBytes } from "@ismail-elkorchi/xml-parser";

const bytes = new TextEncoder().encode("<feed><entry/></feed>");
const document = parseXmlBytes(bytes);
console.log(listElementsByQName(document, "entry").length);
```

## 3. Validate profile constraints

```ts
import { parseXml, validateXmlProfile } from "@ismail-elkorchi/xml-parser";

const document = parseXml("<invoice><line amount=\"10\"/></invoice>");
const result = validateXmlProfile(document, {
  expectedRootQName: "invoice",
  requiredElementQNames: ["line"],
  requiredAttributesByElementQName: {
    line: ["amount"]
  }
});
console.log(result.ok);
```

## 4. Run bundled examples

```bash
npm run examples:run
```
