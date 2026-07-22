import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";

const profile = process.argv.includes("--release") ? "release" : "ci";
const reportsDirectory = new URL("../../reports/", import.meta.url);

await cleanReports();
run("npm", ["run", "check:fast"]);
run("node", ["scripts/qualification/conformance.mjs"]);
run("node", ["scripts/qualification/fuzz.mjs"]);
run("node", ["scripts/qualification/browser.mjs"]);
run("node", ["scripts/qualification/cross-runtime.mjs"]);
run("node", ["scripts/qualification/performance.mjs"]);
run("npm", ["run", "test:package"]);

if (profile === "release") {
  run("node", ["scripts/qualification/oracle.mjs"]);
}

process.stdout.write(`qualification passed: ${profile}\n`);

function run(command, arguments_) {
  const result = spawnSync(command, arguments_, { stdio: "inherit" });
  if (result.error !== undefined) throw result.error;
  if (result.signal !== null) throw new Error(`${command} terminated by ${result.signal}`);
  if (result.status !== 0) process.exit(result.status ?? 1);
}

async function cleanReports() {
  await fs.mkdir(reportsDirectory, { recursive: true });
  for (const entry of await fs.readdir(reportsDirectory, { withFileTypes: true })) {
    if (entry.name !== ".gitkeep") {
      await fs.rm(new URL(entry.name, reportsDirectory), { recursive: true, force: true });
    }
  }
}
