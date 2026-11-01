export type VarType = 'string' | 'number' | 'boolean';

export type ConfigValue = string | number | boolean;

export interface VarSpec {
  /** Name of the environment variable, e.g. 'DELIVERY_DB_URL'. */
  env: string;
  type: VarType;
  required?: boolean;
  default?: ConfigValue;
}

export type ConfigSpec = Record<string, VarSpec>;

export interface InvalidEntry {
  /** Env var name that failed coercion. */
  key: string;
  reason: string;
}

export class ConfigError extends Error {
  readonly missing: string[];
  readonly invalid: InvalidEntry[];

  constructor(missing: string[], invalid: InvalidEntry[]) {
    // TODO: implement — build a message listing every missing/invalid var
    super('Not implemented');
    this.name = 'ConfigError';
    this.missing = missing;
    this.invalid = invalid;
    throw new Error('Not implemented');
  }
}

type ValueForType<T extends VarType> = T extends 'number'
  ? number
  : T extends 'boolean'
    ? boolean
    : string;

export type LoadedConfig<S extends ConfigSpec> = {
  [K in keyof S]: ValueForType<S[K]['type']> | undefined;
};

/**
 * Loads and validates a typed config object from an injected environment.
 * Aggregates every missing required var and every coercion failure into a
 * single ConfigError instead of failing on the first problem.
 */
export function loadConfig<S extends ConfigSpec>(
  env: Record<string, string | undefined>,
  spec: S,
): LoadedConfig<S> {
  // TODO: implement
  throw new Error('Not implemented');
}
