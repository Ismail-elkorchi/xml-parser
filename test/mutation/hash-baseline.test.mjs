import assert from "node:assert/strict";
import test from "node:test";

import { canonicalJson } from "../../dist/internal/hash.js";

test("baseline: canonicalJson sorts top-level object keys", () => {
  const input = { b: 1, a: 2 };
  const result = canonicalJson(input);
  assert.equal(result, '{"a":2,"b":1}');
});
