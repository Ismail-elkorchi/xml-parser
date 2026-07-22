import assert from "node:assert/strict";
import test from "node:test";

import { collectDocSymbols } from "../scripts/quality/doc-jsr-shape.mjs";

test("collectDocSymbols reads current module-scoped Deno output", () => {
  const current = {
    nodes: {
      "file:///mod.ts": {
        symbols: [
          {
            name: "parseXml",
            declarations: [
              {
                declarationKind: "export",
                jsDoc: { doc: "Parse XML" },
                def: { returnType: "document" },
              },
            ],
          },
        ],
      },
    },
  };

  assert.deepEqual(collectDocSymbols(current), [
    {
      name: "parseXml",
      jsDoc: { doc: "Parse XML" },
      functionDef: { returnType: "document" },
    },
  ]);
});

test("collectDocSymbols rejects obsolete and unrelated shapes", () => {
  assert.deepEqual(collectDocSymbols(null), []);
  assert.deepEqual(collectDocSymbols({ nodes: [] }), []);
  assert.deepEqual(collectDocSymbols({ nodes: { module: { symbols: "invalid" } } }), []);
});
