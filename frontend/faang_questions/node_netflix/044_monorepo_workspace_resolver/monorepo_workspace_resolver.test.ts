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

  it('does not report a mismatch for @app/web (its range is satisfied)', () => {
    const { mismatches } = resolveWorkspaces(packages);
    expect(mismatches.some((m) => m.from === '@app/web')).toBe(false);
  });

  it('reports exactly one mismatch for this fixture', () => {
    const { mismatches } = resolveWorkspaces(packages);
    expect(mismatches).toHaveLength(1);
  });

  it('gives every package a graph entry, even with no dependencies field', () => {
    const { internalGraph } = resolveWorkspaces(packages);
    expect(Object.keys(internalGraph).sort()).toEqual([
      '@app/api',
      '@app/ui',
      '@app/web',
    ]);
    expect(internalGraph['@app/api']).toEqual(['@app/ui']);
  });

  it('ignores external dependencies entirely (not in graph, no mismatch)', () => {
    const { internalGraph, mismatches } = resolveWorkspaces(packages);
    expect(internalGraph['@app/web']).not.toContain('react');
    expect(mismatches.some((m) => m.to === 'react')).toBe(false);
  });

  it('lists multiple internal dependencies for a single package', () => {
    const multi: WorkspacePackage[] = [
      {
        name: '@app/core',
        version: '1.0.0',
        dependencies: { '@app/utils': '^1.0.0', '@app/types': '^1.0.0' },
      },
      { name: '@app/utils', version: '1.0.0' },
      { name: '@app/types', version: '1.0.0' },
    ];
    const { internalGraph } = resolveWorkspaces(multi);
    expect(internalGraph['@app/core'].sort()).toEqual([
      '@app/types',
      '@app/utils',
    ]);
  });

  it('reports no mismatches when every internal dependency is satisfied', () => {
    const satisfied: WorkspacePackage[] = [
      {
        name: '@app/core',
        version: '1.0.0',
        dependencies: { '@app/utils': '^1.2.0' },
      },
      { name: '@app/utils', version: '1.4.0' },
    ];
    const { mismatches } = resolveWorkspaces(satisfied);
    expect(mismatches).toEqual([]);
  });

  it('flags a mismatch even for an exact-pin dependency range', () => {
    const pinned: WorkspacePackage[] = [
      {
        name: '@app/core',
        version: '1.0.0',
        dependencies: { '@app/utils': '1.0.0' },
      },
      { name: '@app/utils', version: '1.0.1' },
    ];
    const { mismatches } = resolveWorkspaces(pinned);
    expect(mismatches).toContainEqual({
      from: '@app/core',
      to: '@app/utils',
      required: '1.0.0',
      actual: '1.0.1',
    });
  });

  it('applies 0.x caret pinning rules to internal siblings', () => {
    const zeroMajor: WorkspacePackage[] = [
      {
        name: '@app/core',
        version: '0.2.3',
        dependencies: { '@app/utils': '^0.2.3' },
      },
      { name: '@app/utils', version: '0.3.0' },
    ];
    const { mismatches } = resolveWorkspaces(zeroMajor);
    expect(mismatches).toContainEqual({
      from: '@app/core',
      to: '@app/utils',
      required: '^0.2.3',
      actual: '0.3.0',
    });
  });

  it('produces an empty graph and no mismatches for an empty package list', () => {
    expect(resolveWorkspaces([])).toEqual({
      internalGraph: {},
      mismatches: [],
    });
  });

  it('detects multiple mismatches across different packages', () => {
    const multiMismatch: WorkspacePackage[] = [
      {
        name: '@app/a',
        version: '1.0.0',
        dependencies: { '@app/shared': '^2.0.0' },
      },
      {
        name: '@app/b',
        version: '1.0.0',
        dependencies: { '@app/shared': '^3.0.0' },
      },
      { name: '@app/shared', version: '1.0.0' },
    ];
    const { mismatches } = resolveWorkspaces(multiMismatch);
    expect(mismatches).toHaveLength(2);
    expect(mismatches).toContainEqual({
      from: '@app/a',
      to: '@app/shared',
      required: '^2.0.0',
      actual: '1.0.0',
    });
    expect(mismatches).toContainEqual({
      from: '@app/b',
      to: '@app/shared',
      required: '^3.0.0',
      actual: '1.0.0',
    });
  });
});
