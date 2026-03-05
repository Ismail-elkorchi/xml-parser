/**
 * What it does: executes every public XML example as one smoke path.
 * Expected output: prints "examples:run ok" after all example assertions pass.
 * Constraints: each example must stay deterministic and independent in shared execution.
 * Run: npm run build && node examples/run-all.mjs
 */
import process from "node:process";

import { runParseSuccessPath } from "./parse-success-path.mjs";
import { runParseStreamBudget } from "./parse-stream-budget.mjs";
import { runProfileValidation } from "./profile-validation.mjs";

runParseSuccessPath();
await runParseStreamBudget();
runProfileValidation();

process.stdout.write("examples:run ok\n");
