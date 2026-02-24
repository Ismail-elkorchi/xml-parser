# xml-parser

Deterministic, agent-first XML parser for Node, Deno, Bun, and modern browsers.

## Status
- Active alpha.
- Runtime dependencies are intentionally empty.
- ESM-only package surface.

## Goals
- Deterministic parse output and error taxonomy.
- Security-first defaults for XML threat classes.
- Streaming support with bounded resource budgets.

## Non-goals (current)
- Browser DOM implementation.
- XPath/XQuery execution engine.
- Automatic schema validation in parser core.

## Commands
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm test`
- `npm run smoke:node`
- `npm run smoke:deno`
- `npm run smoke:bun`
- `npm run test:fuzz`
- `npm run eval:ci`
- `npm run eval:release` (requires `python3` for independent oracle check)
- `npm run oracle:xmllint` (local-only, optional binary)

## API
- `parseXml(input, options?)`
- `parseXmlBytes(input, options?)`
- `parseXmlStream(stream, options?)`
- `tokenizeXml(input, options?)`
- `serializeXml(documentOrNode)`
- `getParseErrorSpecRef(parseErrorId)`
- `iterateElements(input)`
- `findFirstElementByQName(input, qName)`
- `listElementsByQName(input, qName)`
- `listElementsByAttribute(input, qName, value?)`
- `listElementsByNamespace(input, namespaceURI, localName?)`
- `listTextNodes(input)`
- `validateXmlProfile(input, profile)`

`parseXmlStream` is incremental and does not retain a full source string in memory.
For stream parses, `document.source` is `null`.

## Security model
- DTD and external entities are disabled by default.
- Structured budget limits enforce bounded parsing.

## Docs
- `docs/xml-profile.md`
- `docs/threat-model.md`
- `docs/parse-errors.md`
- `docs/query-layer.md`
- `docs/schema-validation.md`
- `docs/acceptance-gates.md`
- `docs/eval-report-format.md`
