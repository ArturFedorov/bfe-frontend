export function objectAssign(target: any, ...sources: any[]): any {
  if (target === null || target === undefined) {
    throw new TypeError('Cannot convert undefined or null to object');
  }
  const to = Object(target);

  for (const source of sources) {
    if (source === null || source === undefined) continue;

    const from = Object(source);

    for (const key of Object.keys(from)) {
      to[key] = from[key];
    }

    for (const sym of Object.getOwnPropertySymbols(from)) {
      if (Object.prototype.propertyIsEnumerable.call(from, sym)) {
        to[sym] = from[sym];
      }
    }
  }

  return to;
}
