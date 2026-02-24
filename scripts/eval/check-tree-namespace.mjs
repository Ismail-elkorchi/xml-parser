import fs from "node:fs/promises";

import { parseXml } from "../../dist/mod.js";

const reportPath = new URL("../../reports/tree-namespace.json", import.meta.url);

const fixtures = [
  {
    id: "ns-root-prefix",
    xml: "<n:root xmlns:n=\"urn:n\"><n:child/></n:root>",
    rootNamespace: "urn:n",
    childNamespace: "urn:n"
  },
  {
    id: "ns-default",
    xml: "<root xmlns=\"urn:d\"><child/></root>",
    rootNamespace: "urn:d",
    childNamespace: "urn:d"
  },
  {
    id: "attr-prefix",
    xml: "<root xmlns:p=\"urn:p\" p:id=\"1\"/>",
    rootNamespace: null,
    attrNamespace: "urn:p"
  },
  {
    id: "mixed-prefix-default",
    xml: "<a xmlns=\"urn:a\" xmlns:b=\"urn:b\"><b:c/></a>",
    rootNamespace: "urn:a",
    childNamespace: "urn:b"
  }
];

const results = fixtures.map((fixture) => {
  const parsed = parseXml(fixture.xml);
  const root = parsed.root;
  const child = root?.children.find((entry) => entry.kind === "element");
  const attr = root?.attributes.find((entry) => entry.prefix === "p");
  const ok =
    parsed.errors.length === 0 &&
    (root?.namespaceURI ?? null) === fixture.rootNamespace &&
    (fixture.childNamespace === undefined || (child?.namespaceURI ?? null) === fixture.childNamespace) &&
    (fixture.attrNamespace === undefined || (attr?.namespaceURI ?? null) === fixture.attrNamespace);

  return {
    id: fixture.id,
    ok,
    errors: parsed.errors.map((entry) => entry.parseErrorId)
  };
});

const ok = results.every((entry) => entry.ok);
const report = {
  suite: "tree-namespace",
  timestamp: new Date().toISOString(),
  ok,
  fixtures: results
};

await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (!ok) {
  console.error("Tree namespace check failed", JSON.stringify(report, null, 2));
  process.exit(1);
}
