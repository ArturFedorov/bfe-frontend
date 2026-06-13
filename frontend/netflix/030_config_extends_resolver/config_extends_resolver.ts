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
  // TODO: implement
  throw new Error('Not implemented');
}
