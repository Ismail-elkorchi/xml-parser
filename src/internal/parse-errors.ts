import type { XmlParseError, XmlParseErrorId } from "../contracts/types.ts";

export function createParseError(
  parseErrorId: XmlParseErrorId,
  message: string,
  source: string,
  offset: number,
  checkWork?: () => void
): XmlParseError {
  const boundedOffset = source.length > 0
    ? Math.max(0, Math.min(offset, source.length))
    : Math.max(0, offset);
  let line = 1;
  let column = 1;

  for (let index = 0; index < Math.min(boundedOffset, source.length); index += 1) {
    if ((index & 1023) === 0) checkWork?.();
    if (source.charCodeAt(index) === 10) {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }

  return {
    parseErrorId,
    message,
    offset: boundedOffset,
    line,
    column,
    severity: "error"
  };
}
