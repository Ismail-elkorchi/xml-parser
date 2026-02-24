import fs from "node:fs/promises";

const reportPath = new URL("../../reports/no-runtime-deps.json", import.meta.url);
const packagePath = new URL("../../package.json", import.meta.url);

const pkg = JSON.parse(await fs.readFile(packagePath, "utf8"));
const deps = pkg.dependencies ?? {};
const depNames = Object.keys(deps);
const ok = depNames.length === 0;

const report = {
  suite: "no-runtime-deps",
  timestamp: new Date().toISOString(),
  ok,
  dependencies: depNames
};

await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (!ok) {
  console.error("Runtime dependencies are not allowed:", depNames.join(", "));
  process.exit(1);
}
