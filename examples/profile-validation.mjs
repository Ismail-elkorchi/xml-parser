/**
 * Demonstrates XML profile validation with required elements and attributes.
 * Run: npm run build && node examples/profile-validation.mjs
 */
import process from "node:process";

import { parseXml, validateXmlProfile } from "../dist/mod.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

export function runProfileValidation() {
  const document = parseXml("<invoice><line amount=\"10\"/></invoice>");
  const result = validateXmlProfile(document, {
    expectedRootQName: "invoice",
    requiredElementQNames: ["line"],
    requiredAttributesByElementQName: {
      line: ["amount"]
    }
  });

  assert(result.ok, "profile validation should pass for invoice sample");
  return result;
}

if (import.meta.main) {
  runProfileValidation();
  process.stdout.write("profile-validation ok\n");
}
