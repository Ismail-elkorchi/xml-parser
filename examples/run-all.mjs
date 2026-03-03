/**
 * Runs all public examples used by README and release checks.
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
