import { XmlBudgetExceededError } from "../contracts/errors.ts";
import { assertRecord, invalid } from "./arguments.ts";
import type {
  XmlParseBudgets,
  XmlParseOptions,
  XmlTokenizeBudgets,
  XmlTokenizeOptions
} from "../contracts/types.ts";

export type BudgetCheck = () => void;

export const DEFAULT_BUDGETS: XmlParseBudgets = {
  maxInputBytes: 1_000_000,
  maxStreamBytes: 1_000_000,
  maxNodes: 50_000,
  maxDepth: 256,
  maxAttributesPerElement: 256,
  maxTextBytes: 1_000_000,
  maxErrors: 1_000,
  maxTimeMs: 2_000
};

export const DEFAULT_TOKENIZE_BUDGETS: XmlTokenizeBudgets = {
  maxInputBytes: DEFAULT_BUDGETS.maxInputBytes,
  maxAttributesPerElement: DEFAULT_BUDGETS.maxAttributesPerElement,
  maxErrors: DEFAULT_BUDGETS.maxErrors,
  maxTimeMs: DEFAULT_BUDGETS.maxTimeMs
};

export function resolveBudgets(options: XmlParseOptions): XmlParseBudgets {
  return { ...DEFAULT_BUDGETS, ...resolveOverrides(options, DEFAULT_BUDGETS) };
}

export function resolveTokenizeBudgets(options: XmlTokenizeOptions): XmlTokenizeBudgets {
  return { ...DEFAULT_TOKENIZE_BUDGETS, ...resolveOverrides(options, DEFAULT_TOKENIZE_BUDGETS) };
}

function resolveOverrides(
  options: unknown,
  defaults: object
): Record<string, number> {
  const rawOptions: unknown = options;
  assertRecord(rawOptions, "INVALID_ARGUMENT", "options");
  const rawBudgets = rawOptions["budgets"] ?? {};
  assertRecord(rawBudgets, "INVALID_BUDGET", "options.budgets");
  const overrides: Record<string, number> = {};
  for (const [name, value] of Object.entries(rawBudgets)) {
    if (!Object.hasOwn(defaults, name)) {
      invalid("INVALID_BUDGET", `options.budgets.${name}`, "is not a recognized budget");
    }
    if (typeof value !== "number" || !Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
      invalid("INVALID_BUDGET", `options.budgets.${name}`, "must be a non-negative finite integer");
    }
    overrides[name] = value;
  }
  return overrides;
}

export function assertBudget(
  budget: keyof XmlParseBudgets,
  limit: number,
  actual: number
): void {
  if (actual > limit) {
    throw new XmlBudgetExceededError(budget, limit, actual);
  }
}

export function createTimeBudgetCheck(
  maxTimeMs: number,
  startedAt: number
): BudgetCheck {
  return () => {
    assertBudget("maxTimeMs", maxTimeMs, monotonicNow() - startedAt);
  };
}

export function monotonicNow(): number {
  return globalThis.performance.now();
}

export function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}
