export interface Migration {
  id: string;
  up: () => void;
}

export interface MigrationRunResult {
  applied: string[]; // ids run this invocation
  skipped: string[]; // ids already in `alreadyRun`
}

/**
 * Run migrations in order, skipping any whose id is already in `alreadyRun`
 * (idempotency). Migrations run in ascending id order. Return which ids were
 * applied vs skipped. (Persisting `alreadyRun` is the caller's job.)
 */
export function runMigrations(
  migrations: Migration[],
  alreadyRun: string[],
): MigrationRunResult {
  const sortedMigrations = [...migrations].sort((a, b) =>
    a.id.localeCompare(b.id),
  );

  const result: MigrationRunResult = { applied: [], skipped: [] };
  const alreadyRunSet = new Set(alreadyRun);

  for (const migration of sortedMigrations) {
    if (alreadyRunSet.has(migration.id)) {
      result.skipped.push(migration.id);
      continue;
    }

    migration.up();
    result.applied.push(migration.id);
  }

  return result;
}
