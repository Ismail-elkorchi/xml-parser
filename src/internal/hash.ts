export type WorkCheck = () => void;

function canonicalize(value: unknown, checkWork?: WorkCheck): unknown {
  checkWork?.();
  if (Array.isArray(value)) {
    return value.map((entry) => canonicalize(entry, checkWork));
  }

  if (value && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const keys = Object.keys(source).sort((a, b) => a.localeCompare(b));
    const out: Record<string, unknown> = {};
    for (const key of keys) {
      checkWork?.();
      out[key] = canonicalize(source[key], checkWork);
    }
    return out;
  }

  return value;
}

export function canonicalJson(value: unknown, checkWork?: WorkCheck): string {
  return JSON.stringify(canonicalize(value, checkWork));
}

export function stableHash(value: unknown, checkWork?: WorkCheck): string {
  const body = canonicalJson(value, checkWork);
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  const mod = 0xffffffffffffffffn;

  for (let i = 0; i < body.length; i += 1) {
    if ((i & 1023) === 0) {
      checkWork?.();
    }
    hash ^= BigInt(body.charCodeAt(i));
    hash = (hash * prime) & mod;
  }

  checkWork?.();
  return hash.toString(16).padStart(16, "0");
}
