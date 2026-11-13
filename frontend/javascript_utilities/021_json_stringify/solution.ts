/**
 * A minimal `JSON.stringify` (no replacer/indent, no toJSON, no cycle check).
 *
 * Rules mirrored from the spec:
 * - `undefined`, functions and symbols at the top level -> `undefined`.
 * - Inside objects those values are omitted; inside arrays they become `null`.
 * - Non-finite numbers (`NaN`, `±Infinity`) -> `null`.
 * - Strings are double-quoted with control characters and quotes escaped.
 * - Boxed primitives (`new Number(1)`) unwrap to their primitive value.
 * - `toJSON` (and therefore Date -> ISO string) is intentionally not handled,
 *   per the problem constraints.
 */
export function jsonStringify(value: any): string | undefined {
  // Top-level values that serialize to nothing.
  if (
    value === undefined ||
    typeof value === 'function' ||
    typeof value === 'symbol'
  ) {
    return undefined;
  }

  if (value === null) return 'null';

  switch (typeof value) {
    case 'string':
      return quote(value);
    case 'number':
      return Number.isFinite(value) ? String(value) : 'null';
    case 'boolean':
      return value ? 'true' : 'false';
    case 'bigint':
      throw new TypeError('Do not know how to serialize a BigInt');
  }

  // Boxed primitives unwrap to their primitive representation.
  if (
    value instanceof Number ||
    value instanceof String ||
    value instanceof Boolean
  ) {
    return jsonStringify(value.valueOf());
  }

  if (Array.isArray(value)) {
    // Holes/undefined/functions inside arrays become "null".
    const items = value.map((item) => jsonStringify(item) ?? 'null');
    return `[${items.join(',')}]`;
  }

  // Plain object: own enumerable string keys, skipping unserializable values.
  const pairs: string[] = [];
  for (const key of Object.keys(value)) {
    const serialized = jsonStringify(value[key]);
    if (serialized !== undefined) {
      pairs.push(`${quote(key)}:${serialized}`);
    }
  }
  return `{${pairs.join(',')}}`;
}

/** Wraps a string in double quotes, escaping what JSON requires. */
function quote(str: string): string {
  const escapes: Record<string, string> = {
    '"': '\\"',
    '\\': '\\\\',
    '\b': '\\b',
    '\f': '\\f',
    '\n': '\\n',
    '\r': '\\r',
    '\t': '\\t',
  };

  let out = '"';
  for (const ch of str) {
    if (escapes[ch]) {
      out += escapes[ch];
    } else if (ch < ' ') {
      // Remaining control characters -> \u00XX
      out += '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0');
    } else {
      out += ch;
    }
  }
  return out + '"';
}
