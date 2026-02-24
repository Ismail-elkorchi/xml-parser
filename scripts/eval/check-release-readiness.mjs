import fs from "node:fs/promises";
import { spawnSync } from "node:child_process";

const reportPath = new URL("../../reports/release-readiness.json", import.meta.url);

const pack = spawnSync("npm", ["pack", "--dry-run", "--json"], {
  cwd: process.cwd(),
  encoding: "utf8"
});

if (pack.status !== 0) {
  console.error(pack.stdout || "");
  console.error(pack.stderr || "");
  process.exit(pack.status ?? 1);
}

const entries = JSON.parse(pack.stdout);
const files = entries[0]?.files?.map((entry) => entry.path) ?? [];

const required = ["dist/mod.js", "dist/public/types.js", "README.md", "LICENSE"];
const missing = required.filter((name) => !files.includes(name));

let docsOk = true;
for (const path of ["docs/xml-profile.md", "docs/threat-model.md", "docs/parse-errors.md", "docs/query-layer.md"]) {
  try {
    await fs.access(new URL(`../../${path}`, import.meta.url));
  } catch {
    docsOk = false;
  }
}

const ok = missing.length === 0 && docsOk;
const report = {
  suite: "release-readiness",
  timestamp: new Date().toISOString(),
  ok,
  packFileCount: files.length,
  missing,
  docsOk
};

await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (!ok) {
  console.error("Release readiness check failed", JSON.stringify(report, null, 2));
  process.exit(1);
}
