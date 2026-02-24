import assert from "node:assert/strict";
import test from "node:test";

import { parseXml, validateXmlProfile } from "../dist/mod.js";

const PROFILE = {
  expectedRootQName: "catalog",
  requiredElementQNames: ["book", "title"],
  requiredAttributesByElementQName: {
    book: ["id"]
  },
  maxOccurrencesByElementQName: {
    title: 2
  }
};

test("schema profile validation passes for compliant XML", () => {
  const doc = parseXml("<catalog><book id=\"b1\"><title>One</title></book></catalog>");
  const result = validateXmlProfile(doc, PROFILE);
  assert.equal(result.ok, true);
  assert.deepEqual(result.issues, []);
});

test("schema profile validation is deterministic", () => {
  const docA = parseXml("<catalog><book><title>A</title><title>B</title><title>C</title></book></catalog>");
  const docB = parseXml("<catalog><book><title>A</title><title>B</title><title>C</title></book></catalog>");

  const resultA = validateXmlProfile(docA, PROFILE);
  const resultB = validateXmlProfile(docB, PROFILE);

  assert.deepEqual(resultA, resultB);
  assert.equal(resultA.ok, false);
  assert.equal(resultA.issues.some((entry) => entry.code === "missing-attribute"), true);
  assert.equal(resultA.issues.some((entry) => entry.code === "max-occurrences-exceeded"), true);
});
