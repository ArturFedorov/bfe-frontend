import { findDeadExports, SourceFile } from './dead_export_finder';

const files: SourceFile[] = [
  { path: 'a.ts', code: 'export const used = 1;\nexport const dead = 2;' },
  { path: 'b.ts', code: "import { used } from './a';" },
];

describe('findDeadExports', () => {
  it('reports exports that are never imported', () => {
    expect(findDeadExports(files)).toEqual([{ file: 'a.ts', name: 'dead' }]);
  });

  it('reports nothing when all exports are used', () => {
    const ok: SourceFile[] = [
      { path: 'a.ts', code: 'export const used = 1;' },
      { path: 'b.ts', code: "import { used } from './a';" },
    ];
    expect(findDeadExports(ok)).toEqual([]);
  });
});
