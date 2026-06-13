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
  // TODO: implement
  throw new Error('Not implemented');
}
