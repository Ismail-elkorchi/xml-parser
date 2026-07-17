import { XmlBudgetExceededError } from "./parse-errors.js";
import type { XmlParseBudgets, XmlParseOptions } from "./types.js";

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

export function resolveBudgets(options: XmlParseOptions): XmlParseBudgets {
  const overrides = options.budgets ?? {};
  for (const [name, value] of Object.entries(overrides)) {
    if (!Object.hasOwn(DEFAULT_BUDGETS, name)) {
      throw new TypeError(`Unknown XML parser budget: ${name}`);
    }
    if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
      throw new RangeError(`budgets.${name} must be a non-negative finite integer`);
    }
  }

  return {
    ...DEFAULT_BUDGETS,
    ...overrides
  };
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
