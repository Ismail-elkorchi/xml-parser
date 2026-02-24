function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => canonicalize(entry));
  }

  if (value && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const keys = Object.keys(source).sort((a, b) => a.localeCompare(b));
    const out: Record<string, unknown> = {};
    for (const key of keys) {
      out[key] = canonicalize(source[key]);
    }
    return out;
  }

  return value;
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export function stableHash(value: unknown): string {
  const body = canonicalJson(value);
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  const mod = 0xffffffffffffffffn;

  for (let i = 0; i < body.length; i += 1) {
    hash ^= BigInt(body.charCodeAt(i));
    hash = (hash * prime) & mod;
  }

  return hash.toString(16).padStart(16, "0");
}
