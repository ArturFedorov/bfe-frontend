/**
 * Shallow-copies own enumerable properties (string AND symbol keyed, as the
 * real `Object.assign` does) from each source onto `target`.
 *
 * - `null`/`undefined` sources are skipped.
 * - Later sources win on key collisions.
 * - Values are assigned (not defined), so target setters run.
 * - The mutated `target` itself is returned.
 */
export function objectAssign(target: any, ...sources: any[]): any {
  if (target === null || target === undefined) {
    throw new TypeError('Cannot convert undefined or null to object');
  }

  // Primitives are boxed, matching Object.assign(1, {...}) -> Number{...}
  const to = Object(target);

  for (const source of sources) {
    if (source === null || source === undefined) continue;

    const from = Object(source);

    // Own string keys (enumerable only).
    for (const key of Object.keys(from)) {
      to[key] = from[key];
    }

    // Own symbol keys, filtered to enumerable ones.
    for (const sym of Object.getOwnPropertySymbols(from)) {
      if (Object.prototype.propertyIsEnumerable.call(from, sym)) {
        to[sym] = from[sym];
      }
    }
  }

  return to;
}
