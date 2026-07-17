import type { XmlDocument, XmlElementNode } from "../internal/types.js";

/** Structural checks applied after XML parsing. */
export interface XmlValidationProfile {
  /** Required document-element qualified name. */
  expectedRootQName?: string;
  /** Qualified element names that must occur. */
  requiredElementQNames?: string[];
  /** Required attributes keyed by element qualified name. */
  requiredAttributesByElementQName?: Record<string, string[]>;
  /** Maximum occurrences keyed by element qualified name. */
  maxOccurrencesByElementQName?: Record<string, number>;
}

/** One deterministic structural validation issue. */
export interface XmlValidationIssue {
  /** Stable validation issue category. */
  code:
    | "root-qname-mismatch"
    | "missing-element"
    | "missing-attribute"
    | "max-occurrences-exceeded"
    | "no-root";
  /** Human-readable issue description. */
  message: string;
  /** Related qualified name, when applicable. */
  qName?: string;
  /** Related element qualified name, when applicable. */
  elementQName?: string;
  /** Related attribute qualified name, when applicable. */
  attributeQName?: string;
  /** Related parsed node identifier, when applicable. */
  nodeId?: number;
}

/** Result of applying an XML validation profile. */
export interface XmlValidationResult {
  /** Whether the document satisfies the profile. */
  ok: boolean;
  /** Deterministic validation issues. */
  issues: XmlValidationIssue[];
}

function rootFromInput(input: XmlDocument | XmlElementNode): XmlElementNode | null {
  if (input.kind === "document") {
    return input.root;
  }
  return input;
}

function* walkElements(root: XmlElementNode): Generator<XmlElementNode> {
  yield root;
  for (const child of root.children) {
    if (child.kind === "element") {
      yield* walkElements(child);
    }
  }
}/**
 * Provides deterministic public behavior for `validateXmlProfile`.
 */


export function validateXmlProfile(
  input: XmlDocument | XmlElementNode,
  profile: XmlValidationProfile
): XmlValidationResult {
  const issues: XmlValidationIssue[] = [];
  const root = rootFromInput(input);

  if (!root) {
    issues.push({
      code: "no-root",
      message: "No root element available for validation"
    });
    return {
      ok: false,
      issues
    };
  }

  if (profile.expectedRootQName && root.qName !== profile.expectedRootQName) {
    issues.push({
      code: "root-qname-mismatch",
      message: `Root QName mismatch: expected ${profile.expectedRootQName}, observed ${root.qName}`,
      qName: root.qName,
      nodeId: root.nodeId
    });
  }

  const elementCounts = new Map<string, number>();
  for (const element of walkElements(root)) {
    elementCounts.set(element.qName, (elementCounts.get(element.qName) ?? 0) + 1);

    const requiredAttrs = profile.requiredAttributesByElementQName?.[element.qName] ?? [];
    if (requiredAttrs.length > 0) {
      const attrSet = new Set(element.attributes.map((attr) => attr.qName));
      for (const requiredAttr of requiredAttrs) {
        if (!attrSet.has(requiredAttr)) {
          issues.push({
            code: "missing-attribute",
            message: `Missing required attribute ${requiredAttr} on ${element.qName}`,
            elementQName: element.qName,
            attributeQName: requiredAttr,
            nodeId: element.nodeId
          });
        }
      }
    }
  }

  for (const qName of profile.requiredElementQNames ?? []) {
    if ((elementCounts.get(qName) ?? 0) === 0) {
      issues.push({
        code: "missing-element",
        message: `Missing required element ${qName}`,
        qName
      });
    }
  }

  for (const [qName, max] of Object.entries(profile.maxOccurrencesByElementQName ?? {})) {
    const observed = elementCounts.get(qName) ?? 0;
    if (observed > max) {
      issues.push({
        code: "max-occurrences-exceeded",
        message: `Element ${qName} exceeds max occurrences (${String(observed)} > ${String(max)})`,
        qName
      });
    }
  }

  return {
    ok: issues.length === 0,
    issues
  };
}
