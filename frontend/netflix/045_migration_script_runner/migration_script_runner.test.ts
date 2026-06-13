import { runMigrations, Migration } from './migration_script_runner';

describe('runMigrations', () => {
  it('runs pending migrations in order', () => {
    const order: string[] = [];
    const migrations: Migration[] = [
      { id: '002', up: () => order.push('002') },
      { id: '001', up: () => order.push('001') },
      { id: '003', up: () => order.push('003') },
    ];
    const result = runMigrations(migrations, []);
    expect(order).toEqual(['001', '002', '003']);
    expect(result.applied).toEqual(['001', '002', '003']);
  });

  it('skips already-run migrations (idempotency)', () => {
    const order: string[] = [];
    const migrations: Migration[] = [
      { id: '001', up: () => order.push('001') },
      { id: '002', up: () => order.push('002') },
    ];
    const result = runMigrations(migrations, ['001']);
    expect(order).toEqual(['002']);
    expect(result.skipped).toEqual(['001']);
    expect(result.applied).toEqual(['002']);
  });
});
