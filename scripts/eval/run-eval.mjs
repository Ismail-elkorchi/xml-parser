import fs from "node:fs/promises";
import { spawnSync } from "node:child_process";

const reportsDir = new URL("../../reports/", import.meta.url);

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function cleanReports() {
  try {
    const entries = await fs.readdir(reportsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === ".gitkeep") {
        continue;
      }
      await fs.rm(new URL(entry.name, reportsDir), { recursive: true, force: true });
    }
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      await fs.mkdir(reportsDir, { recursive: true });
      await fs.writeFile(new URL(".gitkeep", reportsDir), "", "utf8");
      return;
    }
    throw error;
  }
}

const profileArg = process.argv.find((arg) => arg.startsWith("--profile="));
const profile = profileArg ? profileArg.split("=")[1] : "ci";

await cleanReports();

run("node", ["scripts/eval/check-no-runtime-deps.mjs"]);
run("node", ["scripts/eval/check-no-node-builtins.mjs"]);
run("node", ["scripts/eval/check-gates.mjs", `--profile=${profile}`]);

const summary = {
  suite: "eval-summary",
  timestamp: new Date().toISOString(),
  profile,
  ok: true,
  reports: ["no-runtime-deps", "no-node-builtins", "gates"]
};
await fs.writeFile(new URL("../../reports/eval-summary.json", import.meta.url), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
console.log(`evaluation complete: profile=${profile} ok=true`);
