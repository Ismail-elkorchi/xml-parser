# @ismail-elkorchi/xml-parser

XML parser with namespaces, canonicalization, validation helpers, and safe DTD defaults.

Supports Node, Deno, Bun, and browsers with explicit XML parse budgets.

No runtime dependencies: this package ships with zero runtime dependencies.

## When To Use

- You need deterministic XML parse and serialization behavior.
- You need explicit budget controls for untrusted XML.
- You need canonicalization, hashing, and replay utilities in one package.

## When Not To Use

- You need a full XSD engine integrated into parse-time behavior.
- You need browser DOM runtime APIs.
- You need permissive DTD/external-entity processing.

## Install

```bash
npm install @ismail-elkorchi/xml-parser
```

```bash
deno add jsr:@ismail-elkorchi/xml-parser
```

## Import

```ts
import { parseXml } from "@ismail-elkorchi/xml-parser";
```

```txt
import { parseXml } from "jsr:@ismail-elkorchi/xml-parser";
```

## Copy/Paste Examples

### Example 1: Parse XML

```ts
import { parseXml } from "@ismail-elkorchi/xml-parser";

const document = parseXml("<root><item/></root>");
console.log(document.kind);
```

### Example 2: Parse streaming XML

```ts
import { parseXmlStream } from "@ismail-elkorchi/xml-parser";

const stream = new ReadableStream({
  start(controller) {
    controller.enqueue(new TextEncoder().encode("<root><item/></root>"));
    controller.close();
  }
});

const document = await parseXmlStream(stream, { budgets: { maxStreamBytes: 4096 } });
console.log(document.kind);
```

### Example 3: Query XML elements

```ts
import { listElementsByQName, parseXml } from "@ismail-elkorchi/xml-parser";

const document = parseXml("<root><item/><item/></root>");
console.log(listElementsByQName(document, "item").length);
```

### Example 4: Validate profile

```ts
import { parseXml, validateXmlProfile } from "@ismail-elkorchi/xml-parser";

const document = parseXml("<invoice><line/></invoice>");
console.log(validateXmlProfile(document, { expectedRootQName: "invoice", requiredElementQNames: ["line"] }).ok);
```

Run packaged examples:

```bash
npm run examples:run
```

## Compatibility

Runtime compatibility matrix:

| Runtime | Status |
| --- | --- |
| Node.js | Supported |
| Deno | Supported |
| Bun | Supported |
| Browser (evergreen) | Supported |

The Node.js package surface is verified against Node 20, 22, and 24.

## Security and Safety Notes

XML parsing is not a trust boundary by itself.
- Keep strict mode enabled.
- Configure parse budgets for untrusted input.
- Validate and sanitize at the application boundary.

## Documentation

- [Docs index](https://github.com/Ismail-elkorchi/xml-parser/blob/main/docs/index.md)
- [First parse success tutorial](https://github.com/Ismail-elkorchi/xml-parser/blob/main/docs/tutorial/first-parse.md)
- [Options reference](https://github.com/Ismail-elkorchi/xml-parser/blob/main/docs/reference/options.md)
