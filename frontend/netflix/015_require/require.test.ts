import { createRequire, FileSystem } from './require';

const fs: FileSystem = {
  '/index.js': "module.exports = require('./math.js').add(1, 2);",
  '/math.js': 'module.exports = { add: (a, b) => a + b };',
  '/data.json': '{ "answer": 42 }',
  '/lib/index.js': "module.exports = 'lib-index';",
};

describe('createRequire', () => {
  it('resolves relative .js modules', () => {
    const req = createRequire(fs);
    expect(req('/index.js')).toBe(3);
  });

  it('parses .json files', () => {
    const req = createRequire(fs);
    expect(req('/data.json')).toEqual({ answer: 42 });
  });

  it('falls back to index.js for directories', () => {
    const req = createRequire(fs);
    expect(req('/lib')).toBe('lib-index');
  });

  it('caches modules (same exports object)', () => {
    const req = createRequire(fs);
    expect(req('/math.js')).toBe(req('/math.js'));
  });
});

describe('createRequire — extension resolution', () => {
  it('resolves a .js module requested without its extension', () => {
    const req = createRequire(fs);
    const math = req('/math') as { add: (a: number, b: number) => number };
    expect(math.add(2, 3)).toBe(5);
  });

  it('resolves a .json module requested without its extension', () => {
    const req = createRequire(fs);
    expect(req('/data')).toEqual({ answer: 42 });
  });

  it('treats the extensionless and extensioned forms as the same module', () => {
    const req = createRequire(fs);
    expect(req('/math')).toBe(req('/math.js'));
  });

  it('prefers an exact file path match', () => {
    const req = createRequire(fs);
    // '/math.js' exists exactly, so it is returned as-is
    expect(req('/math.js')).toBe(req('/math'));
  });
});

describe('createRequire — caching semantics', () => {
  it('returns one shared singleton, so mutations are visible on later requires', () => {
    const req = createRequire(fs);
    const first = req('/math.js') as Record<string, unknown>;
    first.patched = true;
    expect((req('/math') as Record<string, unknown>).patched).toBe(true);
  });

  it('executes each module body only once', () => {
    const counterFs: FileSystem = {
      '/counter.js': 'module.exports = (globalThis.__c = (globalThis.__c || 0) + 1);',
    };
    const req = createRequire(counterFs);
    const a = req('/counter.js');
    const b = req('/counter.js');
    expect(a).toBe(b); // same cached value, body not re-run
  });

  it('gives independent caches to independent createRequire instances', () => {
    const reqA = createRequire(fs);
    const reqB = createRequire(fs);
    (reqA('/math.js') as Record<string, unknown>).tag = 'A';
    expect((reqB('/math.js') as Record<string, unknown>).tag).toBeUndefined();
  });
});

describe('createRequire — relative resolution across directories', () => {
  const nestedFs: FileSystem = {
    '/app/index.js': "module.exports = require('./util').greet('x');",
    '/app/util.js': "module.exports = { greet: (n) => 'hi-' + n };",
    '/app/deep/mod.js': "module.exports = require('../util').greet('deep');",
    '/dir/index.js': "module.exports = require('./sub.js');",
    '/dir/sub.js': "module.exports = 'sub';",
    '/uses-exports.js': 'exports.a = 1; exports.b = 2;',
    '/conf.json': '{ "nested": { "list": [1, 2, 3] } }',
  };

  it('resolves a sibling module via "./"', () => {
    expect(createRequire(nestedFs)('/app/index.js')).toBe('hi-x');
  });

  it('resolves a parent-directory module via "../"', () => {
    expect(createRequire(nestedFs)('/app/deep/mod.js')).toBe('hi-deep');
  });

  it('resolves directory index that itself requires a sibling', () => {
    expect(createRequire(nestedFs)('/dir')).toBe('sub');
  });

  it('supports assigning to exports.* instead of module.exports', () => {
    expect(createRequire(nestedFs)('/uses-exports.js')).toEqual({ a: 1, b: 2 });
  });

  it('parses nested JSON structures', () => {
    expect(createRequire(nestedFs)('/conf.json')).toEqual({
      nested: { list: [1, 2, 3] },
    });
  });
});

describe('createRequire — errors', () => {
  it('throws when a module cannot be found', () => {
    const req = createRequire(fs);
    expect(() => req('/does-not-exist')).toThrow();
  });

  it('throws when a relative dependency cannot be found', () => {
    const brokenFs: FileSystem = {
      '/main.js': "module.exports = require('./missing');",
    };
    const req = createRequire(brokenFs);
    expect(() => req('/main.js')).toThrow();
  });
});
