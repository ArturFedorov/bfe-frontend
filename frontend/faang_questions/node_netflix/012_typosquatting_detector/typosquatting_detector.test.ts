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

describe('generateTyposquats — exact output sets', () => {
  it('produces the full sorted set for "abc"', () => {
    // deletions:     bc, ac, ab
    // swaps:         bac, acb
    // doublings:     aabc, abbc, abcc
    // substitutions: a->4 (4bc), b->6 (a6c)
    // hyphen inserts: a-bc, ab-c
    expect(generateTyposquats('abc')).toEqual([
      '4bc',
      'a-bc',
      'a6c',
      'aabc',
      'ab',
      'ab-c',
      'abbc',
      'abcc',
      'ac',
      'acb',
      'bac',
      'bc',
    ]);
  });

  it('produces the full sorted set for a two-character name "ab"', () => {
    // del: b, a ; swap: ba ; double: aab, abb
    // subs: a->4 (4b), b->6 (a6) ; hyphen insert: a-b
    expect(generateTyposquats('ab')).toEqual([
      '4b',
      'a',
      'a-b',
      'a6',
      'aab',
      'abb',
      'b',
      'ba',
    ]);
  });

  it('collapses duplicate variants for a name with repeated letters "aa"', () => {
    // both deletions -> "a"; the swap -> "aa" (excluded as original);
    // both doublings -> "aaa"; both a->4 subs -> "4a" and "a4"; hyphen -> "a-a"
    expect(generateTyposquats('aa')).toEqual(['4a', 'a', 'a-a', 'a4', 'aaa']);
  });

  it('produces the full sorted set for "sl" (exercises every category)', () => {
    // del: l, s ; swap: ls ; double: ssl, sll
    // subs: s->5 (5l), s->z (zl), l->1 (s1), l->i (si) ; hyphen: s-l
    expect(generateTyposquats('sl')).toEqual([
      '5l',
      'l',
      'ls',
      's',
      's-l',
      's1',
      'si',
      'sll',
      'ssl',
      'zl',
    ]);
  });
});

describe('generateTyposquats — basic edit categories', () => {
  it('emits every single-character deletion', () => {
    const variants = generateTyposquats('npm');
    expect(variants).toContain('pm'); // delete index 0
    expect(variants).toContain('nm'); // delete index 1
    expect(variants).toContain('np'); // delete index 2
  });

  it('emits every adjacent swap', () => {
    const variants = generateTyposquats('node');
    expect(variants).toContain('onde'); // swap 0,1
    expect(variants).toContain('ndoe'); // swap 1,2
    expect(variants).toContain('noed'); // swap 2,3
  });

  it('emits every doubled character', () => {
    const variants = generateTyposquats('vue');
    expect(variants).toContain('vvue'); // double index 0
    expect(variants).toContain('vuue'); // double index 1
    expect(variants).toContain('vuee'); // double index 2
  });

  it('does not swap non-adjacent characters', () => {
    // 'cat' -> swapping c and t (non-adjacent) would give 'tac', which is invalid
    expect(generateTyposquats('cat')).not.toContain('tac');
  });
});

describe('generateTyposquats — homoglyph / leetspeak substitutions', () => {
  it('substitutes digits for visually similar letters', () => {
    const variants = generateTyposquats('best');
    expect(variants).toContain('6est'); // b -> 6
    expect(variants).toContain('b3st'); // e -> 3
    expect(variants).toContain('be5t'); // s -> 5
    expect(variants).toContain('bes7'); // t -> 7
  });

  it('offers multiple substitutions for ambiguous letters', () => {
    // 's' -> '5' and 'z'
    const variants = generateTyposquats('os');
    expect(variants).toContain('o5'); // s -> 5
    expect(variants).toContain('oz'); // s -> z
    // 'o' -> '0'
    expect(variants).toContain('0s');
  });

  it('substitutes between confusable letters (l <-> i)', () => {
    const li = generateTyposquats('li');
    expect(li).toContain('1i'); // l -> 1
    expect(li).toContain('ii'); // l -> i
    expect(li).toContain('l1'); // i -> 1
    expect(li).toContain('ll'); // i -> l
  });

  it('matches substitutions case-insensitively', () => {
    const variants = generateTyposquats('Go');
    expect(variants).toContain('G0'); // o -> 0, surrounding case preserved
    expect(variants).toContain('9o'); // G -> 9
  });

  it('leaves characters without a substitution untouched', () => {
    // none of 'x', 'y', 'z' have substitutions, so no leetspeak variants appear
    const variants = generateTyposquats('xyz');
    expect(variants.some((v) => /[0-9]/.test(v))).toBe(false);
  });
});

describe('generateTyposquats — separator handling', () => {
  it('rewrites hyphens to underscores and strips a hyphen', () => {
    const variants = generateTyposquats('lo-dash');
    expect(variants).toContain('lo_dash'); // - -> _
    expect(variants).toContain('lodash'); // hyphen removed
  });

  it('rewrites underscores to hyphens and strips underscores', () => {
    const variants = generateTyposquats('foo_bar');
    expect(variants).toContain('foo-bar'); // _ -> -
    expect(variants).toContain('foobar'); // underscore removed
  });

  it('inserts a hyphen at each internal boundary when the name has no separator', () => {
    const variants = generateTyposquats('reactdom');
    expect(variants).toContain('r-eactdom'); // boundary after index 0
    expect(variants).toContain('react-dom'); // boundary in the middle
    expect(variants).toContain('reactdo-m'); // boundary before the last char
  });

  it('does not insert hyphens when a separator is already present', () => {
    const variants = generateTyposquats('lo-dash');
    // no spurious hyphen-insertion variants like "l-o-dash"
    expect(variants).not.toContain('l-o-dash');
  });
});

describe('generateTyposquats — structural invariants', () => {
  it('always excludes the original name', () => {
    for (const name of ['react', 'lo-dash', 'foo_bar', 'aab', 'hello']) {
      expect(generateTyposquats(name)).not.toContain(name);
    }
  });

  it('returns a sorted, de-duplicated list for realistic names', () => {
    for (const name of ['typescript', 'lo-dash', 'foo_bar', 'express']) {
      const variants = generateTyposquats(name);
      expect(variants).toEqual([...variants].sort());
      expect(new Set(variants).size).toBe(variants.length);
    }
  });

  it('is pure: repeated calls return equal, independent arrays', () => {
    const a = generateTyposquats('express');
    const b = generateTyposquats('express');
    expect(a).toEqual(b);
    a.push('mutated');
    expect(generateTyposquats('express')).not.toContain('mutated');
  });

  it('never re-emits the original even when a swap reproduces it', () => {
    // adjacent equal letters mean a swap yields the original string
    expect(generateTyposquats('aab')).not.toContain('aab');
    expect(generateTyposquats('hello')).not.toContain('hello');
  });
});

describe('generateTyposquats — edge cases', () => {
  it('returns an empty list for an empty name', () => {
    expect(generateTyposquats('')).toEqual([]);
  });

  it('handles a single-character name', () => {
    // 'a' -> deletion "", doubling "aa", substitution "4"; original excluded
    expect(generateTyposquats('a')).toEqual(['', '4', 'aa']);
  });
});
