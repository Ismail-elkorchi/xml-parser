import fs from "node:fs/promises";

import { parseXml } from "../../../dist/mod.js";

const reportPath = new URL("../../../reports/performance-complexity.json", import.meta.url);
const encoder = new TextEncoder();

function buildPayload(repeatCount) {
  let body = "";
  for (let i = 0; i < repeatCount; i += 1) {
    body += `<item id="${i}"><name>n${i}</name><value>${i}</value><flag a="x" b="y"/></item>`;
  }
  return `<root>${body}</root>`;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function runScenario(name, xml, iterations) {
  const bytes = encoder.encode(xml).length;

  for (let i = 0; i < 5; i += 1) {
    parseXml(xml);
  }

  const durationsNs = [];
  let maxErrors = 0;

  for (let i = 0; i < iterations; i += 1) {
    const start = process.hrtime.bigint();
    const parsed = parseXml(xml);
    const end = process.hrtime.bigint();
    durationsNs.push(Number(end - start));
    maxErrors = Math.max(maxErrors, parsed.errors.length);
  }

  const medianNs = median(durationsNs);
  return {
    name,
    bytes,
    iterations,
    maxErrors,
    medianNs,
    medianMs: Number((medianNs / 1_000_000).toFixed(6)),
    nsPerByte: Number((medianNs / bytes).toFixed(3))
  };
}

const scenarios = [
  { name: "small", xml: buildPayload(20), iterations: 30 },
  { name: "medium", xml: buildPayload(120), iterations: 20 },
  { name: "large", xml: buildPayload(360), iterations: 12 }
];

const results = scenarios.map((scenario) => runScenario(scenario.name, scenario.xml, scenario.iterations));

const nsPerByteValues = results.map((item) => item.nsPerByte);
const maxNsPerByte = Math.max(...nsPerByteValues);
const minNsPerByte = Math.min(...nsPerByteValues);
const nsPerByteRatio = Number((maxNsPerByte / minNsPerByte).toFixed(6));

const medium = results.find((item) => item.name === "medium");
const large = results.find((item) => item.name === "large");
if (!medium || !large) {
  throw new Error("Missing performance scenarios");
}

const growthRatio = Number((large.medianNs / medium.medianNs).toFixed(6));
const parseErrorFree = results.every((item) => item.maxErrors === 0);

const limits = {
  maxNsPerByteRatio: 1.5,
  maxGrowthRatioLargeVsMedium: 4.0
};

const checks = {
  parseErrorFree,
  nsPerByteRatio,
  growthRatio
};

const ok =
  parseErrorFree &&
  nsPerByteRatio <= limits.maxNsPerByteRatio &&
  growthRatio <= limits.maxGrowthRatioLargeVsMedium;

const report = {
  suite: "performance-complexity",
  timestamp: new Date().toISOString(),
  ok,
  limits,
  checks,
  scenarios: results
};

await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (!ok) {
  console.error("Performance complexity check failed", JSON.stringify(report, null, 2));
  process.exit(1);
}
