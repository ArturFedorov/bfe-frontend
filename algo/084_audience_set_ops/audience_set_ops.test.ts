import * as fs from 'fs';
import * as path from 'path';
import {
  union,
  intersect,
  difference,
  intersectMany,
  isSorted,
} from './audience_set_ops';

const subscribers = ['c001', 'c002', 'c005', 'c009'];
const attendees = ['c002', 'c003', 'c009', 'c010'];
const buyers = ['c005', 'c010'];

/** Sorted unique ids `u0000000 ... ` for every i in [0, n) with i % step === offset. */
function ids(n: number, step: number, offset = 0): string[] {
  const out: string[] = [];
  for (let i = offset; i < n; i += step)
    out.push('u' + String(i).padStart(7, '0'));
  return out;
}

describe('isSorted', () => {
  it('accepts strictly increasing arrays, including empty and singleton', () => {
    expect(isSorted([])).toBe(true);
    expect(isSorted(['a'])).toBe(true);
    expect(isSorted(['a', 'b', 'c'])).toBe(true);
    expect(isSorted(['c1', 'c10', 'c2'])).toBe(true); // string order, not numeric
  });

  it('rejects unsorted arrays and duplicates', () => {
    expect(isSorted(['b', 'a'])).toBe(false);
    expect(isSorted(['a', 'b', 'b'])).toBe(false);
    expect(isSorted(['c2', 'c10'])).toBe(false);
  });
});

describe('union', () => {
  it('merges two sorted lists without duplicates', () => {
    expect(union(subscribers, attendees)).toEqual([
      'c001',
      'c002',
      'c003',
      'c005',
      'c009',
      'c010',
    ]);
  });

  it('handles disjoint lists and lists where one is a tail of the other', () => {
    expect(union(['a', 'b'], ['x', 'y'])).toEqual(['a', 'b', 'x', 'y']);
    expect(union(['x', 'y'], ['a', 'b'])).toEqual(['a', 'b', 'x', 'y']);
    expect(union(['a', 'b', 'c'], ['b', 'c', 'd', 'e'])).toEqual([
      'a',
      'b',
      'c',
      'd',
      'e',
    ]);
  });

  it('returns a new array even when one side is empty', () => {
    const out = union(subscribers, []);
    expect(out).toEqual(subscribers);
    expect(out).not.toBe(subscribers);
    const out2 = union([], subscribers);
    expect(out2).toEqual(subscribers);
    expect(out2).not.toBe(subscribers);
    expect(union([], [])).toEqual([]);
  });
});

describe('intersect', () => {
  it('keeps only ids present in both', () => {
    expect(intersect(subscribers, attendees)).toEqual(['c002', 'c009']);
    expect(intersect(attendees, subscribers)).toEqual(['c002', 'c009']);
  });

  it('is empty for disjoint lists or any empty side', () => {
    expect(intersect(['a', 'b'], ['c', 'd'])).toEqual([]);
    expect(intersect([], subscribers)).toEqual([]);
    expect(intersect(subscribers, [])).toEqual([]);
  });

  it('returns a copy when both lists are identical', () => {
    const out = intersect(subscribers, subscribers);
    expect(out).toEqual(subscribers);
    expect(out).not.toBe(subscribers);
  });
});

describe('difference', () => {
  it('removes ids found in the second list', () => {
    expect(difference(subscribers, buyers)).toEqual(['c001', 'c002', 'c009']);
    expect(difference(buyers, subscribers)).toEqual(['c010']);
  });

  it('is not symmetric and drains only the left tail', () => {
    expect(difference(['a', 'b', 'c', 'd'], ['b'])).toEqual(['a', 'c', 'd']);
    expect(difference(['b'], ['a', 'b', 'c', 'd'])).toEqual([]);
    expect(difference(['x', 'y'], ['a', 'b'])).toEqual(['x', 'y']);
  });

  it('returns a new array when nothing is removed, and [] when everything is', () => {
    const out = difference(subscribers, []);
    expect(out).toEqual(subscribers);
    expect(out).not.toBe(subscribers);
    expect(difference(subscribers, subscribers)).toEqual([]);
    expect(difference([], subscribers)).toEqual([]);
  });
});

describe('intersectMany', () => {
  it('intersects every list', () => {
    expect(intersectMany([subscribers, attendees, ['c009', 'c011']])).toEqual([
      'c009',
    ]);
    expect(intersectMany([subscribers, attendees])).toEqual(['c002', 'c009']);
  });

  it('returns [] for no lists and a copy for a single list', () => {
    expect(intersectMany([])).toEqual([]);
    const out = intersectMany([subscribers]);
    expect(out).toEqual(subscribers);
    expect(out).not.toBe(subscribers);
  });

  it('is empty as soon as any list is empty, regardless of position', () => {
    expect(intersectMany([subscribers, [], attendees])).toEqual([]);
    expect(intersectMany([[], subscribers])).toEqual([]);
    expect(intersectMany([subscribers, attendees, []])).toEqual([]);
  });

  it('does not depend on the order lists are given', () => {
    const lists = [ids(60, 2), ids(60, 3), ids(60, 5)];
    const expected = ids(60, 30);
    expect(intersectMany(lists)).toEqual(expected);
    expect(intersectMany([lists[2], lists[0], lists[1]])).toEqual(expected);
  });
});

describe('input validation', () => {
  const bad = ['c2', 'c1'];
  const dup = ['c1', 'c1'];

  it('throws TypeError on unsorted input to any operation', () => {
    expect(() => union(bad, [])).toThrow(TypeError);
    expect(() => union([], bad)).toThrow(TypeError);
    expect(() => intersect(bad, subscribers)).toThrow(TypeError);
    expect(() => difference(subscribers, bad)).toThrow(TypeError);
    expect(() => intersectMany([subscribers, bad])).toThrow(TypeError);
  });

  it('treats duplicates as unsorted', () => {
    expect(() => union(dup, [])).toThrow(TypeError);
    expect(() => intersectMany([dup])).toThrow(TypeError);
  });

  it('never mutates its inputs', () => {
    const a = ['a', 'c', 'e'];
    const b = ['b', 'c', 'd'];
    union(a, b);
    intersect(a, b);
    difference(a, b);
    intersectMany([a, b]);
    expect(a).toEqual(['a', 'c', 'e']);
    expect(b).toEqual(['b', 'c', 'd']);
  });
});

describe('scale', () => {
  const N = 400_000; // 200k evens, ~133k multiples of 3
  const evens = ids(N, 2);
  const threes = ids(N, 3);

  it('runs union / intersect / difference on 200k-element inputs within budget', () => {
    expect(evens).toHaveLength(200_000);
    const start = performance.now();
    const u = union(evens, threes);
    const i = intersect(evens, threes);
    const d = difference(evens, threes);
    const elapsed = performance.now() - start;

    expect(u).toHaveLength(evens.length + threes.length - i.length);
    expect(i).toEqual(ids(N, 6));
    expect(d).toHaveLength(evens.length - i.length);
    expect(isSorted(u)).toBe(true);
    expect(elapsed).toBeLessThan(400);
  });

  it('intersectMany over ten 200k lists finishes within budget', () => {
    const lists = Array.from({ length: 10 }, (_, k) => ids(N + k, 2));
    const start = performance.now();
    const out = intersectMany(lists);
    const elapsed = performance.now() - start;
    expect(out).toEqual(evens);
    expect(elapsed).toBeLessThan(500);
  });
});

describe('senior: implementation hygiene', () => {
  const source = fs.readFileSync(
    path.join(__dirname, 'audience_set_ops.ts'),
    'utf8',
  );

  it('does not use Set', () => {
    expect(source).not.toMatch(/\bnew\s+Set\b|\bSet\s*[<(]/);
  });

  it('does not use includes / indexOf (that would be O(n*m))', () => {
    expect(source).not.toMatch(/\.(includes|indexOf)\s*\(/);
  });
});
