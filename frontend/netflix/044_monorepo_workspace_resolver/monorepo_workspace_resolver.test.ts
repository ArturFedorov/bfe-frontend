import {
  resolveWorkspaces,
  WorkspacePackage,
} from './monorepo_workspace_resolver';

const packages: WorkspacePackage[] = [
  {
    name: '@app/web',
    version: '1.0.0',
    dependencies: { '@app/ui': '^1.0.0', react: '^18.0.0' },
  },
  { name: '@app/ui', version: '1.2.0' },
  { name: '@app/api', version: '1.0.0', dependencies: { '@app/ui': '^2.0.0' } },
];

describe('resolveWorkspaces', () => {
  it('builds the internal dependency graph (ignoring external deps)', () => {
    const { internalGraph } = resolveWorkspaces(packages);
    expect(internalGraph['@app/web']).toEqual(['@app/ui']);
    expect(internalGraph['@app/ui']).toEqual([]);
  });

  it('flags version mismatches against siblings', () => {
    const { mismatches } = resolveWorkspaces(packages);
    expect(mismatches).toContainEqual({
      from: '@app/api',
      to: '@app/ui',
      required: '^2.0.0',
      actual: '1.2.0',
    });
  });
});
