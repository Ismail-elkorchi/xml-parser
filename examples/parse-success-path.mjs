/**
 * Demonstrates deterministic XML parse + serialize workflow.
 * Run: npm run build && node examples/parse-success-path.mjs
 */
import process from "node:process";

import { parseXml, serializeXml } from "../dist/mod.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

export function runParseSuccessPath() {
  const document = parseXml("<root><item id=\"1\">ok</item></root>");
  assert(document.kind === "document", "parseXml should return a document");
  assert(document.root?.qName === "root", "root element should be parsed");

  const serialized = serializeXml(document);
  assert(serialized.includes("<root>"), "serializeXml should preserve root tag");
  return serialized;
}

if (import.meta.main) {
  runParseSuccessPath();
  process.stdout.write("parse-success-path ok\n");
}
