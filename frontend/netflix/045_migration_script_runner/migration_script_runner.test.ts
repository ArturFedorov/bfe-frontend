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

  it('returns empty applied/skipped for no migrations', () => {
    expect(runMigrations([], [])).toEqual({ applied: [], skipped: [] });
    expect(runMigrations([], ['001'])).toEqual({ applied: [], skipped: [] });
  });

  it('skips every migration when all are already run', () => {
    const order: string[] = [];
    const migrations: Migration[] = [
      { id: '001', up: () => order.push('001') },
      { id: '002', up: () => order.push('002') },
    ];
    const result = runMigrations(migrations, ['002', '001']);
    expect(order).toEqual([]);
    expect(result.applied).toEqual([]);
    expect(result.skipped).toEqual(['001', '002']);
  });

  it('ignores alreadyRun ids that have no matching migration', () => {
    const migrations: Migration[] = [{ id: '001', up: () => {} }];
    const result = runMigrations(migrations, ['999']);
    expect(result.applied).toEqual(['001']);
    expect(result.skipped).toEqual([]);
  });

  it('does not invoke up() for a skipped migration', () => {
    const up = jest.fn();
    const migrations: Migration[] = [{ id: '001', up }];
    runMigrations(migrations, ['001']);
    expect(up).not.toHaveBeenCalled();
  });

  it('invokes up() exactly once for each applied migration', () => {
    const up1 = jest.fn();
    const up2 = jest.fn();
    const migrations: Migration[] = [
      { id: '001', up: up1 },
      { id: '002', up: up2 },
    ];
    runMigrations(migrations, []);
    expect(up1).toHaveBeenCalledTimes(1);
    expect(up2).toHaveBeenCalledTimes(1);
  });

  it('reports applied and skipped in ascending id order, not input order', () => {
    const order: string[] = [];
    const migrations: Migration[] = [
      { id: '004', up: () => order.push('004') },
      { id: '001', up: () => order.push('001') },
      { id: '003', up: () => order.push('003') },
      { id: '002', up: () => order.push('002') },
    ];
    const result = runMigrations(migrations, ['002', '004']);
    expect(order).toEqual(['001', '003']);
    expect(result.applied).toEqual(['001', '003']);
    expect(result.skipped).toEqual(['002', '004']);
  });

  it('sorts zero-padded ids of the same width correctly', () => {
    const order: string[] = [];
    const migrations: Migration[] = [
      { id: '010', up: () => order.push('010') },
      { id: '002', up: () => order.push('002') },
      { id: '100', up: () => order.push('100') },
    ];
    const result = runMigrations(migrations, []);
    expect(order).toEqual(['002', '010', '100']);
    expect(result.applied).toEqual(['002', '010', '100']);
  });

  it('handles a mix of applied and skipped migrations interleaved by id', () => {
    const order: string[] = [];
    const migrations: Migration[] = [
      { id: '001', up: () => order.push('001') },
      { id: '002', up: () => order.push('002') },
      { id: '003', up: () => order.push('003') },
      { id: '004', up: () => order.push('004') },
      { id: '005', up: () => order.push('005') },
    ];
    const result = runMigrations(migrations, ['002', '004']);
    expect(order).toEqual(['001', '003', '005']);
    expect(result.applied).toEqual(['001', '003', '005']);
    expect(result.skipped).toEqual(['002', '004']);
  });

  it('does not mutate the input migrations or alreadyRun arrays', () => {
    const migrations: Migration[] = [
      { id: '002', up: () => {} },
      { id: '001', up: () => {} },
    ];
    const alreadyRun = ['001'];
    const migrationsSnapshot = migrations.map((m) => m.id);
    const alreadyRunSnapshot = [...alreadyRun];
    runMigrations(migrations, alreadyRun);
    expect(migrations.map((m) => m.id)).toEqual(migrationsSnapshot);
    expect(alreadyRun).toEqual(alreadyRunSnapshot);
  });
});
