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

  it('returns an ok empty report when no staged files match any hook', () => {
    const hooks: Hook[] = [
      { name: 'eslint', pattern: /\.ts$/, run: () => true },
    ];
    const report = runHooks(['README.md'], hooks);
    expect(report.ran).toEqual([]);
    expect(report.failed).toEqual([]);
    expect(report.ok).toBe(true);
  });

  it('returns an ok empty report when there are no staged files', () => {
    const hooks: Hook[] = [
      { name: 'eslint', pattern: /\.ts$/, run: () => true },
    ];
    const report = runHooks([], hooks);
    expect(report.ran).toEqual([]);
    expect(report.failed).toEqual([]);
    expect(report.ok).toBe(true);
  });

  it('returns an ok empty report when there are no hooks', () => {
    const report = runHooks(['a.ts'], []);
    expect(report.ran).toEqual([]);
    expect(report.failed).toEqual([]);
    expect(report.ok).toBe(true);
  });

  it('runs multiple matching hooks and reports mixed pass/fail results', () => {
    const hooks: Hook[] = [
      { name: 'eslint', pattern: /\.ts$/, run: () => true },
      { name: 'stylelint', pattern: /\.css$/, run: () => false },
      { name: 'markdownlint', pattern: /\.md$/, run: () => true },
    ];
    const report = runHooks(['a.ts', 'b.css', 'c.md'], hooks);
    expect(report.ran).toEqual(['eslint', 'stylelint', 'markdownlint']);
    expect(report.failed).toEqual(['stylelint']);
    expect(report.ok).toBe(false);
  });

  it('marks ok false when every hook fails', () => {
    const hooks: Hook[] = [
      { name: 'eslint', pattern: /\.ts$/, run: () => false },
      { name: 'stylelint', pattern: /\.css$/, run: () => false },
    ];
    const report = runHooks(['a.ts', 'b.css'], hooks);
    expect(report.ran).toEqual(['eslint', 'stylelint']);
    expect(report.failed).toEqual(['eslint', 'stylelint']);
    expect(report.ok).toBe(false);
  });

  it('preserves hook declaration order in ran, independent of staged file order', () => {
    const hooks: Hook[] = [
      { name: 'stylelint', pattern: /\.css$/, run: () => true },
      { name: 'eslint', pattern: /\.ts$/, run: () => true },
    ];
    const report = runHooks(['a.ts', 'b.css'], hooks);
    expect(report.ran).toEqual(['stylelint', 'eslint']);
  });

  it('passes the same matching file to every hook whose pattern matches it', () => {
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
        name: 'prettier',
        pattern: /\.ts$/,
        run: (f) => {
          seen.prettier = f;
          return true;
        },
      },
    ];
    const report = runHooks(['a.ts'], hooks);
    expect(report.ran).toEqual(['eslint', 'prettier']);
    expect(seen.eslint).toEqual(['a.ts']);
    expect(seen.prettier).toEqual(['a.ts']);
  });

  it('does not include a non-matching hook in ran or failed even if it would fail', () => {
    const hooks: Hook[] = [
      { name: 'eslint', pattern: /\.ts$/, run: () => true },
      { name: 'stylelint', pattern: /\.css$/, run: () => false },
    ];
    const report = runHooks(['a.ts'], hooks);
    expect(report.ran).toEqual(['eslint']);
    expect(report.failed).toEqual([]);
    expect(report.ok).toBe(true);
  });
});
