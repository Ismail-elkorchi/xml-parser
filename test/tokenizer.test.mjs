import assert from "node:assert/strict";
import test from "node:test";

import { tokenizeXml, XmlBudgetExceededError, XmlConfigurationError } from "../dist/mod.js";

test("tokenization returns tokens and diagnostics without hiding malformed input", () => {
  const result = tokenizeXml("<root>&missing;</root>");
  assert.deepEqual(result.tokens.map((token) => token.kind), ["start-tag", "text", "end-tag"]);
  assert.deepEqual(result.errors.map((error) => error.parseErrorId), ["undefined-entity"]);
});

test("tokenization is deterministic and normalizes literal attribute whitespace", () => {
  const input = "<root a=\"x\t y\nz\">&#xD;</root>";
  const first = tokenizeXml(input);
  const second = tokenizeXml(input);
  assert.deepEqual(second, first);
  const start = first.tokens[0];
  assert.equal(start?.kind, "start-tag");
  assert.equal(start?.attributes[0]?.value, "x  y z");
  assert.equal(first.tokens[1]?.value, "\r");
});

test("standalone tokenization enforces input, error, time, and attribute budgets", () => {
  assert.throws(() => tokenizeXml("<r/>", { budgets: { maxInputBytes: 3 } }), XmlBudgetExceededError);
  assert.throws(() => tokenizeXml("<r a=\"1\"/>", { budgets: { maxAttributesPerElement: 0 } }), (error) =>
    error instanceof XmlBudgetExceededError && error.budget === "maxAttributesPerElement");
  assert.throws(() => tokenizeXml("<r>&a;&b;</r>", { budgets: { maxErrors: 1 } }), (error) =>
    error instanceof XmlBudgetExceededError && error.budget === "maxErrors");
  assert.throws(() => tokenizeXml("<r/>", { budgets: { maxNodes: 1 } }), (error) =>
    error instanceof XmlConfigurationError && error.code === "INVALID_BUDGET");
});
