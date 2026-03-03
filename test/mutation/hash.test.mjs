import assert from "node:assert/strict";
import test from "node:test";

import { canonicalJson, stableHash } from "../../dist/internal/hash.js";

test("canonicalJson sorts top-level object keys", () => {
  const input = { b: 1, a: 2 };
  const result = canonicalJson(input);
  assert.equal(result, '{"a":2,"b":1}');
});

test("canonicalJson recursively sorts nested object keys", () => {
  const input = { a: { d: 4, c: 3 }, b: 1 };
  const result = canonicalJson(input);
  assert.equal(result, '{"a":{"c":3,"d":4},"b":1}');
});

test("stableHash changes when same-length canonical payload changes", () => {
  const hashA = stableHash({ a: 1 });
  const hashB = stableHash({ a: 2 });
  assert.notEqual(hashA, hashB);
});

test("stableHash remains stable for known canonical input", () => {
  const hash = stableHash({ a: 1 });
  assert.equal(hash, "9c3e82dd6fcae8b1");
});
