import { customSortString } from './custom_sort_string';

function sorted(str: string): string {
  return str.split('').sort().join('');
}

/** Asserts `out` is a permutation of `s` in which ranked characters follow `order`. */
function expectValid(order: string, s: string): void {
  const out = customSortString(order, s);
  expect(out).toHaveLength(s.length);
  expect(sorted(out)).toBe(sorted(s));

  const rank = new Map<string, number>();
  for (let i = 0; i < order.length; i++) rank.set(order[i], i);
  let last = -1;
  let respectsOrder = true;
  for (const ch of out) {
    const r = rank.get(ch);
    if (r === undefined) continue;
    if (r < last) respectsOrder = false;
    last = r;
  }
  expect(respectsOrder).toBe(true);
}

describe('customSortString', () => {
  it('example 1: unranked char may go anywhere', () => {
    expectValid('cba', 'abcd');
  });

  it('example 2: order has chars not present in s', () => {
    expectValid('bcafg', 'abcd');
  });

  it('example 3: duplicates are grouped (unique answer)', () => {
    expect(customSortString('kqep', 'pekeq')).toBe('kqeep');
  });

  it('returns s unchanged (as a permutation) when no chars are ranked', () => {
    expectValid('xyz', 'abcabc');
    expect(sorted(customSortString('xyz', 'abc'))).toBe('abc');
  });

  it('handles all chars ranked with a unique answer', () => {
    expect(customSortString('zyx', 'xxyyzz')).toBe('zzyyxx');
  });

  it('handles a single-character s', () => {
    expect(customSortString('a', 'a')).toBe('a');
    expect(customSortString('b', 'a')).toBe('a');
  });

  it('handles a full alphabet order', () => {
    const order = 'zyxwvutsrqponmlkjihgfedcba';
    expect(customSortString(order, 'leetcode')).toBe('toleeedc');
  });

  it('handles heavy duplicates mixed with unranked chars', () => {
    expectValid('ba', 'aaabbbcccddd');
  });

  it('does not depend on the input order of s', () => {
    expect(customSortString('cba', 'abccba')).toBe('ccbbaa');
  });

  it('handles a large input', () => {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    let s = '';
    for (let i = 0; i < 100_000; i++) s += letters[(i * 7) % 26];
    const order = 'qwertyuiop';
    expectValid(order, s);
  });
});
