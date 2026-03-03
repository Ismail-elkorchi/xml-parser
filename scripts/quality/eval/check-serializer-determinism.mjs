import fs from "node:fs/promises";

import { parseXml, serializeXml } from "../../../dist/mod.js";

const reportPath = new URL("../../../reports/serializer-determinism.json", import.meta.url);
const input = "<root><item b=\"2\" a=\"1\">x&amp;y</item></root>";

const parsed = parseXml(input);
const serializedA = serializeXml(parsed);
const serializedB = serializeXml(parsed);
const deterministic = serializedA === serializedB;

const roundtrip = parseXml(serializedA);
const roundtripOk = roundtrip.errors.length === 0 && roundtrip.determinismHash === parseXml(serializedA).determinismHash;

const ok = deterministic && roundtripOk;
const report = {
  suite: "serializer-determinism",
  timestamp: new Date().toISOString(),
  ok,
  deterministic,
  roundtripOk,
  serialized: serializedA
};

await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (!ok) {
  console.error("Serializer determinism check failed", JSON.stringify(report, null, 2));
  process.exit(1);
}
