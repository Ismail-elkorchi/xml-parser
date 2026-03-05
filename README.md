# @ismail-elkorchi/xml-parser

Deterministic XML parsing for automation pipelines that need stable trees, bounded execution, and explicit security defaults across Node, Deno, Bun, and browser smoke paths.

## When To Use

- You need deterministic parse output and reproducible error reporting.
- You need XML parsing with explicit budget controls.
- You need profile validation and canonicalization helpers in one package.

## When Not To Use

- You need a full XML schema engine integrated into parse-time behavior.
- You need browser DOM APIs.
- You need permissive processing of DTD or external entities.

## Install

```bash
npm install @ismail-elkorchi/xml-parser
```

```bash
deno add jsr:@ismail-elkorchi/xml-parser
```

## Quickstart

```ts
import {
  parseXml,
  parseXmlStream,
  serializeXml,
  validateXmlProfile
} from "@ismail-elkorchi/xml-parser";

const document = parseXml("<invoice><line amount=\"10\">ok</line></invoice>", {
  budgets: { maxInputBytes: 4096, maxNodes: 256, maxDepth: 32 }
});

const stream = new ReadableStream({
  start(controller) {
    controller.enqueue(new TextEncoder().encode("<feed><entry id=\"1\"/>"));
    controller.enqueue(new TextEncoder().encode("<entry id=\"2\"/></feed>"));
    controller.close();
  }
});

const streamed = await parseXmlStream(stream, {
  budgets: { maxStreamBytes: 4096, maxNodes: 256, maxDepth: 32 }
});

const profile = validateXmlProfile(document, {
  expectedRootQName: "invoice",
  requiredElementQNames: ["line"]
});

console.log(profile.ok);
console.log(serializeXml(streamed));
```

Runnable examples:

```bash
npm run examples:run
```

## Options and Config Reference

- [Options and API reference](https://github.com/Ismail-elkorchi/xml-parser/blob/main/docs/reference/options.md)
- [API overview](https://github.com/Ismail-elkorchi/xml-parser/blob/main/docs/reference/api-overview.md)

## Error Handling and Gotchas

- Treat `XmlBudgetExceededError` as an expected guardrail for untrusted or oversized input.
- Strict mode rejects malformed constructs early; update caller behavior to handle explicit parse failures.
- `tokenizeXml()` returns token-level visibility, not a validated semantic model.
- XML declaration and profile checks are deterministic and intentionally conservative.

## Compatibility Matrix

| Runtime | Status | Notes |
| --- | --- | --- |
| Node.js | ✅ | CI + smoke coverage |
| Deno | ✅ | CI + smoke coverage |
| Bun | ✅ | CI + smoke coverage |
| Browser (evergreen) | ✅ | Smoke-tested behavior |

## Security Notes

- DTD declarations are rejected by default.
- External entity resolution is disabled by default (blocks common XXE vectors).
- General entity expansion is limited to predefined and numeric entities; no recursive expansion support is enabled.
- Keep parse budgets enabled for untrusted input to bound CPU and memory behavior.

See [SECURITY.md](https://github.com/Ismail-elkorchi/xml-parser/blob/main/SECURITY.md) and the [threat model](https://github.com/Ismail-elkorchi/xml-parser/blob/main/docs/threat-model.md).

## Design Constraints / Non-goals

- Determinism and safety defaults are prioritized over permissive XML compatibility.
- The package does not fetch external resources while parsing.
- The package does not provide full XML Schema/XSD execution.

## Documentation Map

- [Tutorial](https://github.com/Ismail-elkorchi/xml-parser/blob/main/docs/tutorial/first-parse.md)
- [How-to guides](https://github.com/Ismail-elkorchi/xml-parser/tree/main/docs/how-to)
- [Reference](https://github.com/Ismail-elkorchi/xml-parser/tree/main/docs/reference)
- [Explanation](https://github.com/Ismail-elkorchi/xml-parser/tree/main/docs/explanation)

## Release Validation

```bash
npm run check:fast
npm run docs:lint:jsr
npm run docs:test:jsr
npm run examples:run
npm pack --dry-run
```

Release workflow details: [RELEASING.md](https://github.com/Ismail-elkorchi/xml-parser/blob/main/RELEASING.md)
