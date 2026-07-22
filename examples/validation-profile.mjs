import assert from "node:assert/strict";

import { parseXml, validateXmlProfile } from "../dist/mod.js";

export function runValidationProfileExample() {
  const document = parseXml("<invoice><line amount=\"10\"/></invoice>");
  assert.deepEqual(document.errors, []);
  const result = validateXmlProfile(document, {
    expectedRootQName: "invoice",
    requiredElementQNames: ["line"],
    requiredAttributesByElementQName: {
      line: ["amount"]
    }
  });

  assert.equal(result.ok, true);
  return result;
}

if (import.meta.main) {
  runValidationProfileExample();
  process.stdout.write("validation profile example passed\n");
}
