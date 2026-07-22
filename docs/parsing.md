# Parsing, diagnostics, and budgets

## Entry points

- `parseXml(string)` parses text and retains the normalized source in `document.source`.
- `parseXmlBytes(Uint8Array)` decodes strict UTF-8 and retains the normalized decoded source.
- `parseXmlStream(ReadableStream<Uint8Array>)` enforces limits while reading and returns `source: null`.
- `tokenizeXml(string)` returns lexical tokens and tokenizer diagnostics without building a tree.

All entry points normalize XML line endings. A leading UTF-8 BOM is removed. Byte entry points reject malformed UTF-8 and declarations for encodings other than UTF-8; transcode other encodings before calling the parser.

`parseXmlStream()` decodes chunks as they arrive, but it does not incrementally expose tokens or a partial tree. It reads to EOF before tree construction. The reader is cancelled after failures and its lock is always released.

## Diagnostics

Syntax, namespace, and DTD-policy failures are returned in `document.errors` in source order. Each diagnostic has a stable `parseErrorId`, message, normalized UTF-16 offset, one-based line and column, and `severity: "error"`.

```ts
import { getParseErrorSpecRef, parseXml } from "@ismail-elkorchi/xml-parser";

const document = parseXml("<root><item></root>");
for (const error of document.errors) {
  console.error(error.parseErrorId, error.line, error.column);
  console.error(getParseErrorSpecRef(error.parseErrorId));
}
```

`getParseErrorSpecRef()` returns the closest normative W3C section. It returns `null` for `disallowed-dtd`, because disabling DTDs is package policy rather than an XML well-formedness rule.

The parser can return a recovery tree for malformed input. Reject any non-empty `errors` array when well-formed input is required. `serializeXml()` enforces this rule for parsed documents.

## Resource limits

Document parsing entry points accept `budgets`:

| Budget | Limits |
| --- | --- |
| `maxInputBytes` | UTF-8 input size for every entry point |
| `maxStreamBytes` | Bytes consumed from a stream |
| `maxNodes` | Retained elements and text nodes |
| `maxDepth` | Element nesting depth |
| `maxAttributesPerElement` | Attributes on one start tag |
| `maxTextBytes` | Cumulative retained text size |
| `maxErrors` | Retained diagnostics |
| `maxTimeMs` | Elapsed work across decoding and parsing |

Limits must be non-negative finite integers. Exceeding one throws `XmlBudgetExceededError`, whose `budget`, `limit`, and `actual` fields identify the failure.

Standalone tokenization accepts the limits that apply before tree construction: `maxInputBytes`, `maxAttributesPerElement`, `maxErrors`, and `maxTimeMs`. Passing a tree or stream-only budget to `tokenizeXml()` is a configuration error instead of a silent no-op.

Choose limits from the largest documents the application is expected to accept. A byte limit alone does not replace limits on depth, nodes, attributes, text, errors, or elapsed work.
