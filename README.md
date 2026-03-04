# @ismail-elkorchi/xml-parser

Deterministic XML parsing for automation pipelines that need stable trees, bounded execution, and explicit security defaults across Node, Deno, Bun, and browser smoke paths.

## Install

```bash
npm install @ismail-elkorchi/xml-parser
```

```ts
import { parseXml } from "jsr:@ismail-elkorchi/xml-parser";
```

## Success Path

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

## Options / API Reference

- [Options and API reference](./docs/reference/options.md)

## When To Use

- You need deterministic parse output and reproducible error reporting.
- You need XML parsing with explicit budget controls.
- You need profile validation and canonicalization helpers in one package.

## When Not To Use

- You need a full XML schema engine integrated into parse-time behavior.
- You need browser DOM APIs.
- You need permissive processing of DTD or external entities.

## Security Note

DTD and external entity declarations are rejected by default, which blocks common XXE paths. Entity expansion beyond predefined and numeric entities is not enabled. Keep strict parsing and explicit budgets on for untrusted input. See [SECURITY.md](./SECURITY.md).

## Release Trigger

See [RELEASING.md](./RELEASING.md) for required secrets, trigger methods, and post-publish checks.
