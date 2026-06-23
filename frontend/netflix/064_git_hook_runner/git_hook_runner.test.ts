import { runHooks, Hook } from './git_hook_runner';

describe('runHooks', () => {
  it('runs only hooks matching staged files, with matching files', () => {
    const seen: Record<string, string[]> = {};
    const hooks: Hook[] = [
      {
        name: 'eslint',
        pattern: /\.ts$/,
        run: (f) => {
          seen.eslint = f;
          return true;
        },
      },
      {
        name: 'stylelint',
        pattern: /\.css$/,
        run: (f) => {
          seen.stylelint = f;
          return true;
        },
      },
    ];
    const report = runHooks(['a.ts', 'b.ts', 'README.md'], hooks);
    expect(report.ran).toEqual(['eslint']);
    expect(seen.eslint).toEqual(['a.ts', 'b.ts']);
    expect(report.ok).toBe(true);
  });

  it('reports failures', () => {
    const hooks: Hook[] = [
      { name: 'eslint', pattern: /\.ts$/, run: () => false },
    ];
    const report = runHooks(['a.ts'], hooks);
    expect(report.failed).toEqual(['eslint']);
    expect(report.ok).toBe(false);
  });
});
