import { assertRecord, assertString, invalid } from "../internal/arguments.ts";
import type { XmlDocument, XmlElementNode } from "../contracts/types.ts";
import { isValidXmlQName } from "../internal/xml-syntax.ts";
import { iterateElements } from "./query.ts";

/** Simple qualified-name constraints applied after parsing. This is not XSD validation. */
export interface XmlValidationProfile {
  /** Qualified name required for the document element. */
  readonly expectedRootQName?: string;
  /** Qualified element names that must each occur at least once. */
  readonly requiredElementQNames?: readonly string[];
  /** Required qualified attribute names keyed by qualified element name. */
  readonly requiredAttributesByElementQName?: Readonly<Record<string, readonly string[]>>;
  /** Maximum permitted occurrences keyed by qualified element name. */
  readonly maxOccurrencesByElementQName?: Readonly<Record<string, number>>;
}

/** One structural validation failure. */
export interface XmlValidationIssue {
  /** Stable machine-readable validation outcome. */
  readonly code:
    | "root-qname-mismatch"
    | "missing-element"
    | "missing-attribute"
    | "max-occurrences-exceeded"
    | "no-root";
  /** Human-readable explanation of the failed constraint. */
  readonly message: string;
  /** Qualified name associated with a root, occurrence, or presence constraint. */
  readonly qName?: string;
  /** Qualified element name associated with an attribute constraint. */
  readonly elementQName?: string;
  /** Qualified attribute name required by the profile. */
  readonly attributeQName?: string;
  /** Parsed node identifier associated with the issue, when available. */
  readonly nodeId?: number;
}

/** Result of applying qualified-name constraints to a parsed tree. */
export interface XmlValidationResult {
  /** Whether every configured constraint passed. */
  readonly ok: boolean;
  /** Constraint failures in deterministic evaluation order. */
  readonly issues: readonly XmlValidationIssue[];
}

/**
 * Validates a document or element against simple qualified-name constraints.
 *
 * @example
 * ```ts
 * const document = parseXml("<feed><entry/></feed>");
 * const result = validateXmlProfile(document, {
 *   expectedRootQName: "feed",
 *   requiredElementQNames: ["entry"]
 * });
 * console.log(result.ok);
 * ```
 */
export function validateXmlProfile(
  input: XmlDocument | XmlElementNode,
  profile: XmlValidationProfile
): XmlValidationResult {
  validateProfile(profile);
  const elements = [...iterateElements(input)];
  const root = elements[0] ?? null;
  const issues: XmlValidationIssue[] = [];
  if (root === null) return { ok: false, issues: [{ code: "no-root", message: "No root element available" }] };

  if (profile.expectedRootQName !== undefined && root.qName !== profile.expectedRootQName) {
    issues.push({
      code: "root-qname-mismatch",
      message: `Expected root ${profile.expectedRootQName}, observed ${root.qName}`,
      qName: root.qName,
      nodeId: root.nodeId
    });
  }

  const counts = new Map<string, number>();
  for (const element of elements) {
    counts.set(element.qName, (counts.get(element.qName) ?? 0) + 1);
    const required = profile.requiredAttributesByElementQName?.[element.qName] ?? [];
    const present = new Set(element.attributes.map((attribute) => attribute.qName));
    for (const attributeQName of required) {
      if (!present.has(attributeQName)) {
        issues.push({
          code: "missing-attribute",
          message: `Missing ${attributeQName} on ${element.qName}`,
          elementQName: element.qName,
          attributeQName,
          nodeId: element.nodeId
        });
      }
    }
  }

  for (const qName of profile.requiredElementQNames ?? []) {
    if ((counts.get(qName) ?? 0) === 0) {
      issues.push({ code: "missing-element", message: `Missing element ${qName}`, qName });
    }
  }
  for (const [qName, maximum] of Object.entries(profile.maxOccurrencesByElementQName ?? {})) {
    const actual = counts.get(qName) ?? 0;
    if (actual > maximum) {
      issues.push({
        code: "max-occurrences-exceeded",
        message: `Element ${qName} occurs ${String(actual)} times; maximum is ${String(maximum)}`,
        qName
      });
    }
  }
  return { ok: issues.length === 0, issues };
}

function validateProfile(profile: XmlValidationProfile): void {
  const rawProfile: unknown = profile;
  assertRecord(rawProfile, "INVALID_PROFILE", "profile");
  const expectedRoot = rawProfile["expectedRootQName"];
  if (expectedRoot !== undefined) validateQName(expectedRoot, "profile.expectedRootQName");
  validateQNameArray(rawProfile["requiredElementQNames"], "profile.requiredElementQNames");
  const requiredAttributes = rawProfile["requiredAttributesByElementQName"];
  if (requiredAttributes !== undefined) {
    assertRecord(requiredAttributes, "INVALID_PROFILE", "profile.requiredAttributesByElementQName");
    for (const [qName, attributes] of Object.entries(requiredAttributes)) {
      validateQName(qName, `profile.requiredAttributesByElementQName key ${qName}`);
      validateQNameArray(attributes, `profile.requiredAttributesByElementQName.${qName}`);
    }
  }
  const maximums = rawProfile["maxOccurrencesByElementQName"];
  if (maximums !== undefined) {
    assertRecord(maximums, "INVALID_PROFILE", "profile.maxOccurrencesByElementQName");
    for (const [qName, maximum] of Object.entries(maximums)) {
      validateQName(qName, `profile.maxOccurrencesByElementQName key ${qName}`);
      if (typeof maximum !== "number" || !Number.isSafeInteger(maximum) || maximum < 0) {
        invalid("INVALID_PROFILE", `profile.maxOccurrencesByElementQName.${qName}`, "must be a non-negative safe integer");
      }
    }
  }
}

function validateQNameArray(value: unknown, path: string): void {
  if (value === undefined) return;
  if (!Array.isArray(value)) invalid("INVALID_PROFILE", path, "must be an array");
  for (let index = 0; index < value.length; index += 1) {
    validateQName(value[index] as unknown, `${path}[${String(index)}]`);
  }
}

function validateQName(value: unknown, path: string): asserts value is string {
  assertString(value, path);
  if (!isValidXmlQName(value)) invalid("INVALID_PROFILE", path, "must be a valid XML qualified name");
}
