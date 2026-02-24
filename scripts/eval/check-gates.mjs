import fs from "node:fs/promises";

const reportPath = new URL("../../reports/gates.json", import.meta.url);
const configPath = new URL("../../evaluation.config.json", import.meta.url);

const config = JSON.parse(await fs.readFile(configPath, "utf8"));

const profileArg = process.argv.find((arg) => arg.startsWith("--profile="));
const profile = profileArg ? profileArg.split("=")[1] : "ci";

const required = config.profiles?.[profile]?.requiredReports ?? [];
const gateMap = config.gateMap ?? {};
const checks = [];

for (const name of required) {
  const checkPath = new URL(`../../reports/${name}.json`, import.meta.url);
  let ok = false;
  let details = "missing report";
  try {
    const body = JSON.parse(await fs.readFile(checkPath, "utf8"));
    ok = body.ok === true;
    details = ok ? "ok" : "report indicates failure";
  } catch {
    ok = false;
  }
  checks.push({
    gate: gateMap[name] ?? name,
    report: name,
    ok,
    details
  });
}

const overall = checks.every((check) => check.ok);
const output = {
  suite: "gates",
  timestamp: new Date().toISOString(),
  profile,
  ok: overall,
  checks
};

await fs.writeFile(reportPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

if (!overall) {
  console.error("Gate check failed", JSON.stringify(output, null, 2));
  process.exit(1);
}
