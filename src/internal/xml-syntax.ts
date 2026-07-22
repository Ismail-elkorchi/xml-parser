import type { BudgetCheck } from "./budgets.ts";

export interface XmlNameRead {
  readonly value: string;
  readonly end: number;
}

export function splitXmlQName(qName: string): { readonly prefix: string | null; readonly localName: string } {
  const separator = qName.indexOf(":");
  return separator < 0
    ? { prefix: null, localName: qName }
    : { prefix: qName.slice(0, separator), localName: qName.slice(separator + 1) };
}

export function isXmlCharacter(codePoint: number): boolean {
  return (
    codePoint === 0x9 ||
    codePoint === 0xa ||
    codePoint === 0xd ||
    (codePoint >= 0x20 && codePoint <= 0xd7ff) ||
    (codePoint >= 0xe000 && codePoint <= 0xfffd) ||
    (codePoint >= 0x10000 && codePoint <= 0x10ffff)
  );
}

export function isXmlWhitespace(codePoint: number): boolean {
  return codePoint === 0x9 || codePoint === 0xa || codePoint === 0xd || codePoint === 0x20;
}

export function containsNonXmlWhitespace(value: string): boolean {
  for (let offset = 0; offset < value.length;) {
    const codePoint = value.codePointAt(offset);
    if (codePoint === undefined || !isXmlWhitespace(codePoint)) {
      return true;
    }
    offset += codePoint > 0xffff ? 2 : 1;
  }
  return false;
}

export function isXmlNameStartCharacter(codePoint: number): boolean {
  return (
    codePoint === 0x3a ||
    codePoint === 0x5f ||
    (codePoint >= 0x41 && codePoint <= 0x5a) ||
    (codePoint >= 0x61 && codePoint <= 0x7a) ||
    (codePoint >= 0xc0 && codePoint <= 0xd6) ||
    (codePoint >= 0xd8 && codePoint <= 0xf6) ||
    (codePoint >= 0xf8 && codePoint <= 0x2ff) ||
    (codePoint >= 0x370 && codePoint <= 0x37d) ||
    (codePoint >= 0x37f && codePoint <= 0x1fff) ||
    (codePoint >= 0x200c && codePoint <= 0x200d) ||
    (codePoint >= 0x2070 && codePoint <= 0x218f) ||
    (codePoint >= 0x2c00 && codePoint <= 0x2fef) ||
    (codePoint >= 0x3001 && codePoint <= 0xd7ff) ||
    (codePoint >= 0xf900 && codePoint <= 0xfdcf) ||
    (codePoint >= 0xfdf0 && codePoint <= 0xfffd) ||
    (codePoint >= 0x10000 && codePoint <= 0xeffff)
  );
}

export function isXmlNameCharacter(codePoint: number): boolean {
  return (
    isXmlNameStartCharacter(codePoint) ||
    codePoint === 0x2d ||
    codePoint === 0x2e ||
    codePoint === 0xb7 ||
    (codePoint >= 0x30 && codePoint <= 0x39) ||
    (codePoint >= 0x300 && codePoint <= 0x36f) ||
    (codePoint >= 0x203f && codePoint <= 0x2040)
  );
}

export function readXmlName(
  source: string,
  start: number,
  checkTime: BudgetCheck
): XmlNameRead | null {
  const first = source.codePointAt(start);
  if (first === undefined || !isXmlNameStartCharacter(first)) {
    return null;
  }

  let cursor = start + (first > 0xffff ? 2 : 1);
  let scanned = 0;
  while (cursor < source.length) {
    if ((scanned & 1023) === 0) {
      checkTime();
    }
    scanned += 1;

    const codePoint = source.codePointAt(cursor);
    if (codePoint === undefined || !isXmlNameCharacter(codePoint)) {
      break;
    }
    cursor += codePoint > 0xffff ? 2 : 1;
  }

  return {
    value: source.slice(start, cursor),
    end: cursor
  };
}

export function isValidXmlQName(value: string): boolean {
  const firstColon = value.indexOf(":");
  if (firstColon < 0) {
    return isValidXmlNcName(value);
  }
  if (firstColon === 0 || firstColon === value.length - 1 || value.includes(":", firstColon + 1)) {
    return false;
  }
  return isValidXmlNcName(value.slice(0, firstColon)) && isValidXmlNcName(value.slice(firstColon + 1));
}

export function normalizeXmlLineEndings(value: string): string {
  return value.replaceAll("\r\n", "\n").replaceAll("\r", "\n");
}

export function normalizeLiteralAttributeWhitespace(value: string): string {
  return value.replace(/[\t\n\r]/g, " ");
}

export function isValidXmlNcName(value: string): boolean {
  if (value.length === 0) {
    return false;
  }

  let offset = 0;
  const first = value.codePointAt(offset);
  if (first === undefined || first === 0x3a || !isXmlNameStartCharacter(first)) {
    return false;
  }
  offset += first > 0xffff ? 2 : 1;

  while (offset < value.length) {
    const codePoint = value.codePointAt(offset);
    if (codePoint === undefined || codePoint === 0x3a || !isXmlNameCharacter(codePoint)) {
      return false;
    }
    offset += codePoint > 0xffff ? 2 : 1;
  }
  return true;
}
