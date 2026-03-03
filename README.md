# xml-parser

Deterministic, agent-first XML parser for Node, Deno, Bun, and browser smoke verification.

## Install (target package identity)
```bash
npm install @ismail-elkorchi/xml-parser
```

## Status
- Active alpha.
- Runtime dependencies are intentionally empty.
- ESM-only package surface.
- Enforced runtime matrix: Node, Deno, Bun.
- Browser runtime smoke evidence is generated and gate-checked.

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
- `npm run smoke:browser`
- `npm run test:fuzz`
- `npm run examples:run`
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
- `canonicalizeXml(input)`
- `computeCanonicalSha256(input)`
- `verifyCanonicalSha256(input, expectedHex)`
- `signCanonicalXml(input, privateKey, algorithm?)`
- `verifyCanonicalXmlSignature(input, signature, publicKey, algorithm?)`
- `createXmlReplayContract(input, options?)`
- `verifyXmlReplayContract(input, expectedContract, options?)`

`parseXmlStream` is incremental and does not retain a full source string in memory.
For stream parses, `document.source` is `null`.

## Quickstart
```ts
import { parseXml, serializeXml } from "@ismail-elkorchi/xml-parser";

const document = parseXml("<root><item id=\"1\">ok</item></root>");
console.log(serializeXml(document));
```

Run executable examples:

```bash
npm run examples:run
```

## Security model
- DTD and external entities are disabled by default.
- Structured budget limits enforce bounded parsing.
- Vulnerability reporting and support window: `SECURITY.md`.

## Docs map
- Entry index: `docs/index.md`
- Tutorial: `docs/tutorial/first-parse.md`
- How-to: `docs/how-to/release-validation.md`, `docs/how-to/mutation-pilot.md`
- Reference: `docs/reference/api-overview.md`
- Explanation: `docs/explanation/architecture-and-tradeoffs.md`

## Docs
- `docs/xml-profile.md`
- `docs/threat-model.md`
- `docs/parse-errors.md`
- `docs/query-layer.md`
- `docs/schema-validation.md`
- `docs/canonical-signature.md`
- `docs/agent-diagnostics-replay.md`
- `docs/reference/acceptance-gates.md`
- `docs/reference/eval-report-format.md`
