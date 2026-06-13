import { compare, gt, lt, eq } from './semver_comparator';

describe('semver comparator', () => {
  it('orders by major', () => {
    expect(compare('2.0.0', '1.9.9')).toBe(1);
    expect(compare('1.0.0', '2.0.0')).toBe(-1);
  });

  it('orders by minor then patch', () => {
    expect(compare('1.2.0', '1.1.9')).toBe(1);
    expect(compare('1.1.1', '1.1.2')).toBe(-1);
  });

  it('detects equality', () => {
    expect(compare('1.2.3', '1.2.3')).toBe(0);
  });

  it('exposes gt / lt / eq helpers', () => {
    expect(gt('1.2.4', '1.2.3')).toBe(true);
    expect(lt('1.2.3', '1.2.4')).toBe(true);
    expect(eq('1.2.3', '1.2.3')).toBe(true);
  });
});
