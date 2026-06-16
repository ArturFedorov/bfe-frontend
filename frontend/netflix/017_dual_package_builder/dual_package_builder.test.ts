import { buildDual } from './dual_package_builder';

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
