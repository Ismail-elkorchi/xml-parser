import type { XmlDocument, XmlElementNode } from "../internal/types.js";

export interface XmlValidationProfile {
  expectedRootQName?: string;
  requiredElementQNames?: string[];
  requiredAttributesByElementQName?: Record<string, string[]>;
  maxOccurrencesByElementQName?: Record<string, number>;
}

export interface XmlValidationIssue {
  code:
    | "root-qname-mismatch"
    | "missing-element"
    | "missing-attribute"
    | "max-occurrences-exceeded"
    | "no-root";
  message: string;
  qName?: string;
  elementQName?: string;
  attributeQName?: string;
  nodeId?: number;
}

export interface XmlValidationResult {
  ok: boolean;
  issues: XmlValidationIssue[];
}

function rootFromInput(input: XmlDocument | XmlElementNode): XmlElementNode | null {
  if ((input as XmlDocument).kind === "document") {
    return (input as XmlDocument).root;
  }
  return input as XmlElementNode;
}

function* walkElements(root: XmlElementNode): Generator<XmlElementNode> {
  yield root;
  for (const child of root.children) {
    if (child.kind === "element") {
      yield* walkElements(child);
    }
  }
}

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
        message: `Element ${qName} exceeds max occurrences (${observed} > ${max})`,
        qName
      });
    }
  }

  return {
    ok: issues.length === 0,
    issues
  };
}
