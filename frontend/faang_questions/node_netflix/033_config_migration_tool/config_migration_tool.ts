export interface Migration {
  // rename a key, optionally transforming its value
  from: string;
  to: string;
  transform?: (value: unknown) => unknown;
}

export interface MigrationResult {
  config: Record<string, unknown>;
  changes: string[]; // human-readable change log
}

/**
 * Apply an ordered list of key migrations to a config object. With dryRun=true,
 * compute the change log WITHOUT mutating/returning a changed config (return the
 * original config unchanged, but still report what WOULD change).
 */
export function migrateConfig(
  config: Record<string, unknown>,
  migrations: Migration[],
  dryRun = false,
): MigrationResult {
  // TODO: implement
  throw new Error('Not implemented');
}
