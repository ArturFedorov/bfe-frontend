import { runCodemod, SourceFile } from './codemod_engine';

const files: SourceFile[] = [
  { path: 'a.ts', code: 'var x = 1;' },
  { path: 'b.ts', code: 'const y = 2;' },
  { path: 'c.ts', code: 'boom' },
];

const transform = (code: string) => {
  if (code === 'boom') throw new Error('cannot parse');
  return code.replace('var ', 'const ');
};

describe('runCodemod', () => {
  it('classifies changed, unchanged and errored files', () => {
    const result = runCodemod(files, transform);
    expect(result.changed).toEqual(['a.ts']);
    expect(result.unchanged).toEqual(['b.ts']);
    expect(result.errors).toEqual([{ path: 'c.ts', message: 'cannot parse' }]);
  });

  it('does not abort on a failing file', () => {
    expect(() => runCodemod(files, transform)).not.toThrow();
  });

  it('returns empty buckets when there are no files', () => {
    const result = runCodemod([], transform);
    expect(result.changed).toEqual([]);
    expect(result.unchanged).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it('marks every file changed when the transform always rewrites', () => {
    const upper: SourceFile[] = [
      { path: 'a.ts', code: 'a' },
      { path: 'b.ts', code: 'b' },
    ];
    const result = runCodemod(upper, (code) => code.toUpperCase());
    expect(result.changed).toEqual(['a.ts', 'b.ts']);
    expect(result.unchanged).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it('marks every file unchanged when the transform is the identity', () => {
    const identity: SourceFile[] = [
      { path: 'a.ts', code: 'a' },
      { path: 'b.ts', code: 'b' },
    ];
    const result = runCodemod(identity, (code) => code);
    expect(result.changed).toEqual([]);
    expect(result.unchanged).toEqual(['a.ts', 'b.ts']);
    expect(result.errors).toEqual([]);
  });

  it('collects an error entry for every file when all transforms throw', () => {
    const boomFiles: SourceFile[] = [
      { path: 'a.ts', code: 'a' },
      { path: 'b.ts', code: 'b' },
    ];
    const alwaysThrows = () => {
      throw new Error('nope');
    };
    const result = runCodemod(boomFiles, alwaysThrows);
    expect(result.changed).toEqual([]);
    expect(result.unchanged).toEqual([]);
    expect(result.errors).toEqual([
      { path: 'a.ts', message: 'nope' },
      { path: 'b.ts', message: 'nope' },
    ]);
  });

  it('passes each file its own path to the transform', () => {
    const seenPaths: string[] = [];
    const pathAware: SourceFile[] = [
      { path: 'a.ts', code: 'x' },
      { path: 'b.ts', code: 'x' },
    ];
    runCodemod(pathAware, (code, path) => {
      seenPaths.push(path);
      return code;
    });
    expect(seenPaths).toEqual(['a.ts', 'b.ts']);
  });

  it('uses the path to decide per-file output, changing only matching files', () => {
    const perPath: SourceFile[] = [
      { path: 'keep.ts', code: 'same' },
      { path: 'rewrite.ts', code: 'same' },
    ];
    const result = runCodemod(perPath, (code, path) =>
      path === 'rewrite.ts' ? 'different' : code,
    );
    expect(result.changed).toEqual(['rewrite.ts']);
    expect(result.unchanged).toEqual(['keep.ts']);
  });

  it('preserves original file order within each bucket', () => {
    const mixed: SourceFile[] = [
      { path: 'first.ts', code: 'var a = 1;' },
      { path: 'second.ts', code: 'const b = 2;' },
      { path: 'third.ts', code: 'boom' },
      { path: 'fourth.ts', code: 'var c = 3;' },
    ];
    const result = runCodemod(mixed, transform);
    expect(result.changed).toEqual(['first.ts', 'fourth.ts']);
    expect(result.unchanged).toEqual(['second.ts']);
    expect(result.errors).toEqual([
      { path: 'third.ts', message: 'cannot parse' },
    ]);
  });
});
