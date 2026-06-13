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
});
