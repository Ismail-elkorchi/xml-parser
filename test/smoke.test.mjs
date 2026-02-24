import assert from "node:assert/strict";
import test from "node:test";

import { parseXml, parseXmlBytes, parseXmlStream } from "../dist/mod.js";

test("parseXml is deterministic", () => {
  const input = "<root><child/></root>";
  const a = parseXml(input);
  const b = parseXml(input);
  assert.deepEqual(b, a);
});

test("parseXmlBytes returns same source as string parse", () => {
  const input = "<root>ok</root>";
  const bytes = new TextEncoder().encode(input);
  const fromString = parseXml(input);
  const fromBytes = parseXmlBytes(bytes);
  assert.equal(fromBytes.source, fromString.source);
});

test("parseXmlStream returns parsed source", async () => {
  const input = "<root><n/></root>";
  const bytes = new TextEncoder().encode(input);
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(bytes.subarray(0, 5));
      controller.enqueue(bytes.subarray(5));
      controller.close();
    }
  });

  const parsed = await parseXmlStream(stream);
  assert.equal(parsed.source, input);
});
