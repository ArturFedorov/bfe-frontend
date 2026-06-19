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

describe('resolveExports — string shorthand', () => {
  it('resolves a bare string for the main entry', () => {
    expect(resolveExports('./index.js', '.', ['import'])).toBe('./index.js');
  });

  it('returns null for any subpath other than "." on a string shorthand', () => {
    expect(resolveExports('./index.js', './utils', ['import'])).toBeNull();
  });

  it('ignores conditions for a string shorthand', () => {
    expect(resolveExports('./index.js', '.', [])).toBe('./index.js');
    expect(resolveExports('./index.js', '.', ['require', 'node'])).toBe('./index.js');
  });
});

describe('resolveExports — bare conditions object (implicit ".")', () => {
  const bare: ExportsField = {
    import: './a.mjs',
    require: './a.cjs',
    default: './a.js',
  };

  it('treats a top-level conditions object as the main entry', () => {
    expect(resolveExports(bare, '.', ['import'])).toBe('./a.mjs');
    expect(resolveExports(bare, '.', ['require'])).toBe('./a.cjs');
  });

  it('falls back to default for an unmatched condition', () => {
    expect(resolveExports(bare, '.', ['browser'])).toBe('./a.js');
  });

  it('returns null for any subpath on a bare conditions object', () => {
    expect(resolveExports(bare, './utils', ['import'])).toBeNull();
  });
});

describe('resolveExports — condition key order', () => {
  it('matches the first key present in the active conditions (per key order)', () => {
    // Keys are ordered require-then-import; both are active, so require wins.
    const field: ExportsField = {
      '.': { require: './r.cjs', import: './i.mjs' },
    };
    expect(resolveExports(field, '.', ['import', 'require'])).toBe('./r.cjs');
  });

  it('is independent of the order of the conditions argument', () => {
    const field: ExportsField = {
      '.': { import: './i.mjs', require: './r.cjs' },
    };
    expect(resolveExports(field, '.', ['import', 'require'])).toBe('./i.mjs');
    expect(resolveExports(field, '.', ['require', 'import'])).toBe('./i.mjs');
  });
});

describe('resolveExports — nested conditions', () => {
  const field: ExportsField = {
    '.': {
      node: {
        import: './node.mjs',
        require: './node.cjs',
      },
      default: './browser.js',
    },
  };

  it('descends into nested condition objects', () => {
    expect(resolveExports(field, '.', ['node', 'import'])).toBe('./node.mjs');
    expect(resolveExports(field, '.', ['node', 'require'])).toBe('./node.cjs');
  });

  it('uses the outer default when the outer condition is absent', () => {
    expect(resolveExports(field, '.', ['browser'])).toBe('./browser.js');
  });

  it('falls through to the outer default when no inner condition matches', () => {
    // 'node' matches but neither 'import' nor 'require' is active and the
    // nested object has no default, so resolution continues to the outer default.
    expect(resolveExports(field, '.', ['node'])).toBe('./browser.js');
  });
});

describe('resolveExports — no match', () => {
  it('returns null when no condition matches and there is no default', () => {
    const field: ExportsField = { '.': { import: './i.mjs' } };
    expect(resolveExports(field, '.', ['require'])).toBeNull();
  });

  it('returns null for empty conditions when there is no default', () => {
    const field: ExportsField = { '.': { import: './i.mjs', require: './r.cjs' } };
    expect(resolveExports(field, '.', [])).toBeNull();
  });

  it('matches default with empty conditions when a default exists', () => {
    const field: ExportsField = { '.': { import: './i.mjs', default: './d.js' } };
    expect(resolveExports(field, '.', [])).toBe('./d.js');
  });
});

describe('resolveExports — multiple subpaths and conditions', () => {
  const field: ExportsField = {
    '.': { import: './index.mjs', default: './index.js' },
    './feature': {
      node: { import: './feature.node.mjs' },
      import: './feature.mjs',
      default: './feature.js',
    },
    './styles.css': './styles.css',
  };

  it('prefers a nested matching condition over a sibling condition', () => {
    expect(resolveExports(field, './feature', ['node', 'import'])).toBe(
      './feature.node.mjs',
    );
  });

  it('falls to a sibling condition when the nested one does not apply', () => {
    expect(resolveExports(field, './feature', ['import'])).toBe('./feature.mjs');
  });

  it('falls to default for an unmatched subpath condition', () => {
    expect(resolveExports(field, './feature', ['browser'])).toBe('./feature.js');
  });

  it('resolves a subpath that maps directly to a string', () => {
    expect(resolveExports(field, './styles.css', ['import'])).toBe('./styles.css');
  });

  it('still resolves the main entry alongside subpaths', () => {
    expect(resolveExports(field, '.', ['import'])).toBe('./index.mjs');
  });
});
