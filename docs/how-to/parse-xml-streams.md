# Parse XML Streams

Goal: parse chunked XML bytes from streaming sources.

```ts
import { parseXmlStream } from "@ismail-elkorchi/xml-parser";

const stream = new ReadableStream({
  start(controller) {
    controller.enqueue(new TextEncoder().encode("<feed><entry id=\"1\"/>"));
    controller.enqueue(new TextEncoder().encode("<entry id=\"2\"/></feed>"));
    controller.close();
  }
});

const document = await parseXmlStream(stream, {
  budgets: {
    maxStreamBytes: 16_384,
    maxNodes: 2_048,
    maxDepth: 64
  }
});

console.log(document.kind);
```

Expected output:
- Stable parse result independent of chunk boundaries.
