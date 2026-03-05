# First Parse Success

This tutorial gets you from input to deterministic XML output.

## Step 1: Parse XML

```ts
import { parseXml } from "@ismail-elkorchi/xml-parser";

const document = parseXml("<invoice><line amount=\"10\"/></invoice>");
console.log(document.kind);
```

Expected output:

```txt
document
```

## Step 2: Serialize XML

```ts
import { parseXml, serializeXml } from "@ismail-elkorchi/xml-parser";

const document = parseXml("<root><item/></root>");
console.log(serializeXml(document));
```

Expected output:

```txt
<root><item/></root>
```

## Step 3: Run examples

```bash
npm run examples:run
```

What you get:
- Confirmation that package examples run in your local environment.
