export type ExportsField = string | { [key: string]: ExportsField };

/**
 * Resolve a subpath against a package.json `exports` field for a set of active
 * conditions (e.g. ['import', 'node']). Support:
 *   - string shorthand ("." mapping)
 *   - subpath keys ("./sub")
 *   - condition objects ("import" / "require" / "node" / "browser" / "default")
 * Return the matched target string, or null when nothing matches.
 */
export function resolveExports(
  exportsField: ExportsField,
  subpath: string,
  conditions: string[],
): string | null {
  if(typeof exportsField === 'string') {
    return subpath === '.' ? exportsField : null;
  }

  const keys = Object.keys(exportsField);
  const isSubpathMap = keys.some((key) => key.startsWith('.'));

  if(isSubpathMap) {
    const value = exportsField[subpath];
    if(value === undefined) return null;

    if(typeof value === 'string') return value;

    return resolveConditions(value, conditions);
  } else {
    if(subpath !== '.') return null;
    return resolveConditions(exportsField, conditions);
  }
}

function resolveConditions(obj: Record<string, ExportsField>, conditions: string[]): string | null {
  const conditionSet = new Set(conditions);

  for(const key of Object.keys(obj)) {
    if(key === 'default') continue;

    if(conditionSet.has(key)) {
      const value = obj[key];

      if(typeof value === 'string') return value;

      const result = resolveConditions(value, conditions);
      if(result !== null) return result;
    }
  }

  if('default'  in obj) {
    const value = obj.default;
    if(typeof value === 'string') return value;

    return resolveConditions(value, conditions);
  }

  return null;
}