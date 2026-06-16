import { resolveExports, ExportsField } from './package_exports_resolver';

const exportsField: ExportsField = {
  '.': {
    import: './index.mjs',
    require: './index.cjs',
    default: './index.js',
  },
  './utils': {
    import: './utils.mjs',
    require: './utils.cjs',
  },
};

describe('resolveExports', () => {
  it('matches conditions for the main entry', () => {
    expect(resolveExports(exportsField, '.', ['import'])).toBe('./index.mjs');
    expect(resolveExports(exportsField, '.', ['require'])).toBe('./index.cjs');
  });

  it('falls back to default', () => {
    expect(resolveExports(exportsField, '.', ['browser'])).toBe('./index.js');
  });

  it('resolves subpaths', () => {
    expect(resolveExports(exportsField, './utils', ['import'])).toBe(
      './utils.mjs',
    );
  });

  it('returns null for unknown subpaths', () => {
    expect(resolveExports(exportsField, './nope', ['import'])).toBeNull();
  });
});
