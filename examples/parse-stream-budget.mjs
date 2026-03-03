/**
 * Demonstrates streaming XML parsing with explicit resource budgets.
 * Run: npm run build && node examples/parse-stream-budget.mjs
 */
import process from "node:process";
import { TextEncoder } from "node:util";

import { parseXmlStream } from "../dist/mod.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

export async function runParseStreamBudget() {
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

  assert(document.root?.qName === "feed", "stream parse should produce feed root");
  return document;
}

if (import.meta.main) {
  await runParseStreamBudget();
  process.stdout.write("parse-stream-budget ok\n");
}
