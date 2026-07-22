# @ismail-elkorchi/xml-parser

A dependency-free XML 1.0 parser for Node.js, Deno, Bun, and modern browsers. It provides namespace-aware element and attribute trees, typed diagnostics, resource limits, serialization, queries, and simple structural validation.

The parser intentionally does not process DTDs. It supports predefined and numeric character references, but not document-defined entities, external entities, XSD, DOM APIs, canonical XML, or XML signatures.

## Install

```sh
npm install @ismail-elkorchi/xml-parser
```

```sh
deno add jsr:@ismail-elkorchi/xml-parser
```

## Parse XML

```ts
import { parseXml } from "@ismail-elkorchi/xml-parser";

const document = parseXml('<feed xmlns="urn:example"><entry id="1">Hello</entry></feed>');

if (document.errors.length > 0) {
  throw new Error(document.errors.map((error) => error.message).join("\n"));
}

console.log(document.root?.localName);     // feed
console.log(document.root?.namespaceURI); // urn:example
```

Malformed input produces a recovery tree and typed diagnostics. Always inspect `document.errors` before trusting or serializing the result.

## Bytes and streams

`parseXmlBytes()` and `parseXmlStream()` accept UTF-8 only. The stream API enforces byte limits while reading, releases its reader on every path, and builds the tree after the complete stream has been decoded.

```ts
import { parseXmlStream } from "@ismail-elkorchi/xml-parser";

const response = await fetch("https://example.test/feed.xml");
if (!response.body) throw new Error("Response has no body");

const document = await parseXmlStream(response.body, {
  budgets: {
    maxInputBytes: 2_000_000,
    maxStreamBytes: 2_000_000,
    maxNodes: 25_000,
    maxDepth: 128,
    maxAttributesPerElement: 128,
    maxTextBytes: 1_000_000,
    maxErrors: 100,
    maxTimeMs: 2_000
  }
});
```

Exceeded limits throw `XmlBudgetExceededError`. Invalid options, arguments, profiles, and caller-constructed trees throw `XmlConfigurationError`. Invalid UTF-8 or a non-UTF-8 encoding declaration supplied to a byte API throws `XmlDecodingError`.

## Query and serialize

```ts
import { listElementsByQName, parseXml, serializeXml } from "@ismail-elkorchi/xml-parser";

const document = parseXml("<catalog><book id=\"1\"/><book id=\"2\"/></catalog>");
if (document.errors.length > 0) throw new Error("Malformed XML");

console.log(listElementsByQName(document, "book").length); // 2
console.log(serializeXml(document));
```

The retained tree contains elements and text nodes. XML declarations, comments, processing instructions, DTDs, and the distinction between CDATA and ordinary text are not retained, so serialization is structural rather than a lexical round trip.

## Documentation

- [Documentation index](./docs/index.md)
- [Parsing, diagnostics, and budgets](./docs/parsing.md)
- [Tree model and queries](./docs/data-model.md)
- [Serialization and validation](./docs/serialization-and-validation.md)
- [Development and releases](./docs/development.md)
- [Security policy](./SECURITY.md)

Node.js 20, 22, and 24 are tested. Cross-runtime qualification covers Node.js, Deno, Bun, and Chromium. See [the runnable examples](./examples/) for complete programs.
