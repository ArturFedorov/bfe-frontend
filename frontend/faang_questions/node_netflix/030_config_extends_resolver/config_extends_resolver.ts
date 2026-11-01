export interface Config {
  extends?: string | string[];
  [key: string]: unknown;
}

/**
 * Resolve a tsconfig-style `extends` chain. `configs` maps a name to its config.
 * Deep-merge base configs first, then overlay the child (child wins). When a
 * config lists multiple `extends`, later entries win over earlier ones.
 * The `extends` key itself must not appear in the output.
 */
export function resolveConfig(
  configs: Record<string, Config>,
  name: string,
): Config {
  const config = configs[name];
  if (!config) return {};

  const parents = normalizeExtend(config);

  let merged: Config = {};
  for (const parent of parents) {
    merged = deepMerge(merged, resolveConfig(configs, parent));
  }

  merged = deepMerge(merged, config);

  delete merged.extends;

  return merged;
}

function deepMerge(base: Config, overlay: Config): Config {
  const result: Config = { ...base };

  for (const key of Object.keys(overlay)) {
    if (isObject(result[key] as Config) && isObject(overlay[key] as Config)) {
      result[key] = deepMerge(result[key] as Config, overlay[key] as Config);
    } else {
      result[key] = overlay[key];
    }
  }

  return result;
}

function isObject(obj: Config) {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
}

function normalizeExtend(config: Config): string[] {
  if (!config.extends) return [];
  return Array.isArray(config.extends)
    ? config.extends
    : [config.extends as string];
}
