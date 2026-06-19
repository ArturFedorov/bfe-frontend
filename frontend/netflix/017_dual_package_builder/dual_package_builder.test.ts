import { buildDual } from './dual_package_builder';

// Execute generated CommonJS and return whatever it puts on `module.exports`.
function runCjs(cjs: string): any {
  const mod: any = { exports: {} };
  const fn = new Function('module', 'exports', cjs);
  fn(mod, mod.exports);
  return mod.exports;
}

describe('buildDual', () => {
  it('keeps the ESM output intact', () => {
    const src = 'export const x = 1;';
    expect(buildDual(src).esm).toBe(src);
  });

  it('converts named exports to CommonJS', () => {
    const { cjs } = buildDual('export const x = 1;');
    // a require should be able to read `x`
    const mod: any = {};
    const fn = new Function('module', 'exports', cjs);
    fn(mod, (mod.exports = {}));
    expect(mod.exports.x).toBe(1);
  });

  it('converts default export to module.exports', () => {
    const { cjs } = buildDual('export default 42;');
    const mod: any = {};
    const fn = new Function('module', 'exports', cjs);
    fn(mod, (mod.exports = {}));
    expect(mod.exports).toBe(42);
  });
});

describe('buildDual — ESM passthrough', () => {
  it('returns multi-statement ESM byte-for-byte', () => {
    const src = 'export const a = 1;\nexport const b = 2;';
    expect(buildDual(src).esm).toBe(src);
  });

  it('returns default-export ESM unchanged', () => {
    const src = 'export default { ready: true };';
    expect(buildDual(src).esm).toBe(src);
  });

  it('does not depend on the cjs result (esm equals input)', () => {
    const src = 'export function f(a) { return a; }';
    expect(buildDual(src).esm).toBe(src);
  });
});

describe('buildDual — named const exports', () => {
  it('exposes a numeric const on exports', () => {
    expect(runCjs(buildDual('export const x = 1;').cjs).x).toBe(1);
  });

  it('exposes a const initialized from an expression', () => {
    expect(runCjs(buildDual('export const sum = 2 + 3;').cjs).sum).toBe(5);
  });

  it('exposes a const holding an object literal', () => {
    expect(runCjs(buildDual('export const cfg = { a: 1, b: 2 };').cjs).cfg).toEqual({
      a: 1,
      b: 2,
    });
  });

  it('exposes a const holding an array literal', () => {
    expect(runCjs(buildDual('export const xs = [1, 2, 3];').cjs).xs).toEqual([1, 2, 3]);
  });

  it('exposes multiple named consts at once', () => {
    const { cjs } = buildDual('export const a = 1;\nexport const b = 2;');
    const exp = runCjs(cjs);
    expect(exp).toMatchObject({ a: 1, b: 2 });
  });
});

describe('buildDual — named function exports', () => {
  it('exposes a callable function on exports', () => {
    const { cjs } = buildDual('export function inc(n) { return n + 1; }');
    expect(runCjs(cjs).inc(41)).toBe(42);
  });

  it('preserves multiple parameters', () => {
    const { cjs } = buildDual('export function add(a, b) { return a + b; }');
    expect(runCjs(cjs).add(2, 5)).toBe(7);
  });

  it('exposes both a function and a const together', () => {
    const { cjs } = buildDual('export const base = 10;\nexport function over(n) { return n; }');
    const exp = runCjs(cjs);
    expect(exp.base).toBe(10);
    expect(exp.over(3)).toBe(3);
  });
});

describe('buildDual — default exports', () => {
  it('maps a primitive default to module.exports', () => {
    expect(runCjs(buildDual('export default 42;').cjs)).toBe(42);
  });

  it('maps an object default to module.exports', () => {
    expect(runCjs(buildDual('export default { ok: true };').cjs)).toEqual({ ok: true });
  });

  it('maps an array default to module.exports', () => {
    expect(runCjs(buildDual('export default [1, 2];').cjs)).toEqual([1, 2]);
  });
});

describe('buildDual — non-exported statements', () => {
  it('keeps local declarations available without exporting them', () => {
    const { cjs } = buildDual('const secret = 41;\nexport const answer = secret + 1;');
    const exp = runCjs(cjs);
    expect(exp.answer).toBe(42);
    expect(exp.secret).toBeUndefined();
  });

  it('lets an exported function close over a local helper', () => {
    const src = 'const two = 2;\nexport function double(n) { return n * two; }';
    expect(runCjs(buildDual(src).cjs).double(21)).toBe(42);
  });
});

describe('buildDual — determinism', () => {
  it('produces identical output for identical input', () => {
    const src = 'export const x = 1;\nexport default x;';
    expect(buildDual(src)).toEqual(buildDual(src));
  });
});
