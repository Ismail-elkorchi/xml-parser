import fs from "node:fs/promises";

const reportPath = new URL("../../../reports/scope-threat-model.json", import.meta.url);

const requiredDocs = [
  {
    path: "docs/xml-profile.md",
    markers: ["Supported profile", "Explicit exclusions", "Deterministic"]
  },
  {
    path: "docs/threat-model.md",
    markers: ["XXE", "CWE-611", "Security defaults", "maxInputBytes"]
  },
  {
    path: "docs/reference/decision-records/ADR-001-xml-profile-security-defaults.md",
    markers: ["Decision", "disable DTD", "budget"]
  }
];

const details = [];
for (const doc of requiredDocs) {
  let ok;
  let missingMarkers = [];
  try {
    const body = await fs.readFile(new URL(`../../../${doc.path}`, import.meta.url), "utf8");
    missingMarkers = doc.markers.filter((marker) => !body.includes(marker));
    ok = missingMarkers.length === 0;
  } catch {
    ok = false;
    missingMarkers = [...doc.markers];
  }

  details.push({
    path: doc.path,
    ok,
    missingMarkers
  });
}

const ok = details.every((entry) => entry.ok);
const report = {
  suite: "scope-threat-model",
  timestamp: new Date().toISOString(),
  ok,
  checks: details
};

await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (!ok) {
  console.error("Scope/threat-model check failed", JSON.stringify(report, null, 2));
  process.exit(1);
}
