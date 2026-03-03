import fs from "node:fs/promises";

import { parseXml, parseXmlStream, XmlBudgetExceededError } from "../../../dist/mod.js";

const reportPath = new URL("../../../reports/stream-budgets.json", import.meta.url);
const input = "<root><item id=\"1\">alpha</item><item id=\"2\">beta</item></root>";

const bytes = new TextEncoder().encode(input);
const stream = new ReadableStream({
  start(controller) {
    controller.enqueue(bytes.subarray(0, 8));
    controller.enqueue(bytes.subarray(8, 24));
    controller.enqueue(bytes.subarray(24));
    controller.close();
  }
});

const fromString = parseXml(input);
const fromStream = await parseXmlStream(stream);
const parityOk = fromString.determinismHash === fromStream.determinismHash;

let budgetFailureOk = false;
let budgetFailure = null;
try {
  await parseXmlStream(
    new ReadableStream({
      start(controller) {
        controller.enqueue(bytes);
        controller.close();
      }
    }),
    {
      budgets: {
        maxStreamBytes: 8
      }
    }
  );
} catch (error) {
  if (error instanceof XmlBudgetExceededError) {
    budgetFailureOk = error.details.budget === "maxStreamBytes";
    budgetFailure = error.details;
  }
}

const ok = parityOk && budgetFailureOk;
const report = {
  suite: "stream-budgets",
  timestamp: new Date().toISOString(),
  ok,
  parityOk,
  budgetFailureOk,
  budgetFailure
};

await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (!ok) {
  console.error("Stream/budgets check failed", JSON.stringify(report, null, 2));
  process.exit(1);
}
