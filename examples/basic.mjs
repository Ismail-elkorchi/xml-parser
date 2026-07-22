import assert from "node:assert/strict";

import { listElementsByQName, parseXml, serializeXml } from "../dist/mod.js";

export function runBasicExample() {
  const document = parseXml('<catalog><book id="1">XML</book></catalog>');
  assert.deepEqual(document.errors, []);
  assert.equal(document.root?.qName, "catalog");
  assert.equal(listElementsByQName(document, "book").length, 1);

  const serialized = serializeXml(document);
  assert.equal(serialized, '<catalog><book id="1">XML</book></catalog>');
  return serialized;
}

if (import.meta.main) {
  runBasicExample();
  process.stdout.write("basic example passed\n");
}
