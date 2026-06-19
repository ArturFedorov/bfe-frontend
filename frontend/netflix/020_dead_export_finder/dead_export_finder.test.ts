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

describe('findDeadExports — export forms', () => {
  it('detects dead `export function` declarations', () => {
    const src: SourceFile[] = [
      { path: 'a.ts', code: 'export function used() {}\nexport function dead() {}' },
      { path: 'b.ts', code: "import { used } from './a';" },
    ];
    expect(findDeadExports(src)).toEqual([{ file: 'a.ts', name: 'dead' }]);
  });

  it('detects dead `export class` declarations', () => {
    const src: SourceFile[] = [
      { path: 'a.ts', code: 'export class Used {}\nexport class Dead {}' },
      { path: 'b.ts', code: "import { Used } from './a';" },
    ];
    expect(findDeadExports(src)).toEqual([{ file: 'a.ts', name: 'Dead' }]);
  });

  it('detects dead `export let` declarations', () => {
    const src: SourceFile[] = [
      { path: 'a.ts', code: 'export let used = 1;\nexport let dead = 2;' },
      { path: 'b.ts', code: "import { used } from './a';" },
    ];
    expect(findDeadExports(src)).toEqual([{ file: 'a.ts', name: 'dead' }]);
  });

  it('detects dead names inside an `export { ... }` block', () => {
    const src: SourceFile[] = [
      {
        path: 'a.ts',
        code: 'const used = 1;\nconst dead = 2;\nexport { used, dead };',
      },
      { path: 'b.ts', code: "import { used } from './a';" },
    ];
    expect(findDeadExports(src)).toEqual([{ file: 'a.ts', name: 'dead' }]);
  });
});

describe('findDeadExports — import forms', () => {
  it('counts an export imported under an alias as used', () => {
    const src: SourceFile[] = [
      { path: 'a.ts', code: 'export const used = 1;' },
      { path: 'b.ts', code: "import { used as u } from './a';" },
    ];
    expect(findDeadExports(src)).toEqual([]);
  });

  it('handles multiple named imports in one statement', () => {
    const src: SourceFile[] = [
      { path: 'a.ts', code: 'export const a = 1;\nexport const b = 2;\nexport const c = 3;' },
      { path: 'b.ts', code: "import { a, c } from './a';" },
    ];
    expect(findDeadExports(src)).toEqual([{ file: 'a.ts', name: 'b' }]);
  });

  it('handles imports spread across multiple lines', () => {
    const src: SourceFile[] = [
      { path: 'a.ts', code: 'export const a = 1;\nexport const b = 2;' },
      { path: 'b.ts', code: "import {\n  a,\n  b,\n} from './a';" },
    ];
    expect(findDeadExports(src)).toEqual([]);
  });
});

describe('findDeadExports — cross-file usage', () => {
  it('treats an export imported by any file as alive', () => {
    const src: SourceFile[] = [
      { path: 'a.ts', code: 'export const shared = 1;' },
      { path: 'b.ts', code: "import { shared } from './a';" },
      { path: 'c.ts', code: "import { shared } from './a';" },
    ];
    expect(findDeadExports(src)).toEqual([]);
  });

  it('reports dead exports from several files, sorted by file then name', () => {
    const src: SourceFile[] = [
      { path: 'b.ts', code: 'export const zeta = 1;\nexport const alpha = 2;' },
      { path: 'a.ts', code: 'export const dead = 1;' },
      { path: 'c.ts', code: "import { alpha } from './b';" },
    ];
    expect(findDeadExports(src)).toEqual([
      { file: 'a.ts', name: 'dead' },
      { file: 'b.ts', name: 'zeta' },
    ]);
  });
});

describe('findDeadExports — edge cases', () => {
  it('returns an empty array when there are no files', () => {
    expect(findDeadExports([])).toEqual([]);
  });

  it('returns an empty array when no file declares an export', () => {
    const src: SourceFile[] = [
      { path: 'a.ts', code: 'const local = 1;' },
      { path: 'b.ts', code: "import { x } from './nowhere';" },
    ];
    expect(findDeadExports(src)).toEqual([]);
  });

  it('reports every export when nothing is imported at all', () => {
    const src: SourceFile[] = [
      { path: 'a.ts', code: 'export const x = 1;\nexport const y = 2;' },
    ];
    expect(findDeadExports(src)).toEqual([
      { file: 'a.ts', name: 'x' },
      { file: 'a.ts', name: 'y' },
    ]);
  });
});
