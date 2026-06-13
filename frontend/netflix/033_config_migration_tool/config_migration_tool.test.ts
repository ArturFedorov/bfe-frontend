import { migrateConfig, Migration } from './config_migration_tool';

const migrations: Migration[] = [
  { from: 'oldName', to: 'newName' },
  { from: 'count', to: 'count', transform: (v) => Number(v) * 2 },
];

describe('migrateConfig', () => {
  it('renames and transforms keys', () => {
    const { config } = migrateConfig(
      { oldName: 'x', count: 5 },
      migrations,
    );
    expect(config).toEqual({ newName: 'x', count: 10 });
  });

  it('reports changes', () => {
    const { changes } = migrateConfig({ oldName: 'x' }, migrations);
    expect(changes.length).toBeGreaterThan(0);
  });

  it('does not mutate config in dry-run mode', () => {
    const input = { oldName: 'x' };
    const { config, changes } = migrateConfig(input, migrations, true);
    expect(config).toEqual({ oldName: 'x' });
    expect(changes.length).toBeGreaterThan(0);
  });
});
