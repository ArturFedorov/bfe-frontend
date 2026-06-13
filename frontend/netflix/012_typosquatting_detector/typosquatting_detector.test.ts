import { generateTyposquats } from './typosquatting_detector';

describe('generateTyposquats', () => {
  it('produces deletions, swaps and doublings', () => {
    const variants = generateTyposquats('abc');
    // deletions: bc, ac, ab ; swaps: bac, acb ; doublings: aabc, abbc, abcc
    expect(variants).toContain('bc');
    expect(variants).toContain('bac');
    expect(variants).toContain('aabc');
  });

  it('never includes the original name', () => {
    expect(generateTyposquats('abc')).not.toContain('abc');
  });

  it('returns a sorted, de-duplicated list', () => {
    const variants = generateTyposquats('aa');
    expect(variants).toEqual([...variants].sort());
    expect(new Set(variants).size).toBe(variants.length);
  });
});
