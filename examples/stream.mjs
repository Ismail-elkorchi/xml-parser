import assert from "node:assert/strict";

import { parseXmlStream } from "../dist/mod.js";

export async function runStreamExample() {
  const stream = new globalThis.ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode("<feed><entry id=\"1\"/>"));
      controller.enqueue(new TextEncoder().encode("<entry id=\"2\"/></feed>"));
      controller.close();
    }
  });

  const document = await parseXmlStream(stream, {
    budgets: {
      maxStreamBytes: 4096,
      maxNodes: 256,
      maxDepth: 32,
      maxErrors: 8
    }
  });

  assert.deepEqual(document.errors, []);
  assert.equal(document.root?.qName, "feed");
  assert.equal(document.source, null);
  return document;
}

if (import.meta.main) {
  await runStreamExample();
  process.stdout.write("stream example passed\n");
}
