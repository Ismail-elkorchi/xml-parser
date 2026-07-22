import { assertRecord, assertString, invalid } from "../internal/arguments.ts";
import type { XmlDocument, XmlElementNode, XmlTextNode } from "../contracts/types.ts";

function asElement(value: unknown, path: string): XmlElementNode {
  assertRecord(value, "INVALID_ARGUMENT", path);
  if (value["kind"] !== "element") invalid("INVALID_ARGUMENT", `${path}.kind`, 'must be "element"');
  assertString(value["qName"], `${path}.qName`);
  assertString(value["localName"], `${path}.localName`);
  assertNullableString(value["prefix"], `${path}.prefix`);
  assertNullableString(value["namespaceURI"], `${path}.namespaceURI`);
  if (!Array.isArray(value["children"])) invalid("INVALID_ARGUMENT", `${path}.children`, "must be an array");
  if (!Array.isArray(value["attributes"])) invalid("INVALID_ARGUMENT", `${path}.attributes`, "must be an array");
  for (let index = 0; index < value["attributes"].length; index += 1) {
    const attribute: unknown = value["attributes"][index];
    const attributePath = `${path}.attributes[${String(index)}]`;
    assertRecord(attribute, "INVALID_ARGUMENT", attributePath);
    assertString(attribute["qName"], `${attributePath}.qName`);
    assertString(attribute["localName"], `${attributePath}.localName`);
    assertNullableString(attribute["prefix"], `${attributePath}.prefix`);
    assertNullableString(attribute["namespaceURI"], `${attributePath}.namespaceURI`);
    assertString(attribute["value"], `${attributePath}.value`);
  }
  return value as unknown as XmlElementNode;
}

function assertNullableString(value: unknown, path: string): asserts value is string | null {
  if (value !== null) assertString(value, path);
}

function resolveRoot(input: unknown): XmlElementNode | null {
  assertRecord(input, "INVALID_ARGUMENT", "input");
  if (input["kind"] === "document") {
    return input["root"] === null ? null : asElement(input["root"], "input.root");
  }
  return asElement(input, "input");
}

/** Iterates elements in depth-first document order. */
export function* iterateElements(input: XmlDocument | XmlElementNode): Generator<XmlElementNode> {
  const root = resolveRoot(input);
  if (root === null) return;
  const stack: unknown[] = [root];
  const seen = new WeakSet<object>();
  while (stack.length > 0) {
    const rawElement = stack.pop();
    const element = asElement(rawElement, "input tree element");
    if (seen.has(element)) invalid("INVALID_ARGUMENT", "input", "must be an acyclic tree");
    seen.add(element);
    yield element;
    for (let index = element.children.length - 1; index >= 0; index -= 1) {
      const child: unknown = element.children[index];
      assertRecord(child, "INVALID_ARGUMENT", `input tree child[${String(index)}]`);
      if (child["kind"] === "element") stack.push(child);
      else if (child["kind"] !== "text") {
        invalid("INVALID_ARGUMENT", `input tree child[${String(index)}].kind`, 'must be "element" or "text"');
      }
    }
  }
}

/** Returns elements whose qualified name exactly matches `qName`. */
export function listElementsByQName(input: XmlDocument | XmlElementNode, qName: string): XmlElementNode[] {
  assertString(qName, "qName");
  return [...iterateElements(input)].filter((element) => element.qName === qName);
}

/** Returns the first element whose qualified name exactly matches `qName`. */
export function findFirstElementByQName(
  input: XmlDocument | XmlElementNode,
  qName: string
): XmlElementNode | null {
  assertString(qName, "qName");
  for (const element of iterateElements(input)) {
    if (element.qName === qName) return element;
  }
  return null;
}

/** Returns elements containing a qualified attribute name and optional exact value. */
export function listElementsByAttribute(
  input: XmlDocument | XmlElementNode,
  qName: string,
  value?: string
): XmlElementNode[] {
  assertString(qName, "qName");
  if (value !== undefined) assertString(value, "value");
  return [...iterateElements(input)].filter((element) =>
    element.attributes.some((attribute) =>
      attribute.qName === qName && (value === undefined || attribute.value === value)
    )
  );
}

/** Returns elements in a namespace, optionally restricted to one local name. */
export function listElementsByNamespace(
  input: XmlDocument | XmlElementNode,
  namespaceURI: string,
  localName?: string
): XmlElementNode[] {
  assertString(namespaceURI, "namespaceURI");
  if (localName !== undefined) assertString(localName, "localName");
  return [...iterateElements(input)].filter((element) =>
    element.namespaceURI === namespaceURI && (localName === undefined || element.localName === localName)
  );
}

/** Returns all text nodes in depth-first document order. */
export function listTextNodes(input: XmlDocument | XmlElementNode): XmlTextNode[] {
  const root = resolveRoot(input);
  if (root === null) return [];
  const result: XmlTextNode[] = [];
  const stack: unknown[] = [root];
  const seen = new WeakSet<object>();
  while (stack.length > 0) {
    const rawNode = stack.pop();
    assertRecord(rawNode, "INVALID_ARGUMENT", "input tree node");
    if (seen.has(rawNode)) invalid("INVALID_ARGUMENT", "input", "must be an acyclic tree");
    seen.add(rawNode);
    if (rawNode["kind"] === "text") {
      assertString(rawNode["value"], "input tree text.value");
      result.push(rawNode as unknown as XmlTextNode);
      continue;
    }
    const element = asElement(rawNode, "input tree element");
    for (let index = element.children.length - 1; index >= 0; index -= 1) {
      stack.push(element.children[index]);
    }
  }
  return result;
}
