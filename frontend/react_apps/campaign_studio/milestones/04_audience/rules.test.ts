import { customers } from '../../shell/fixtures';
import type { Customer } from '../../shell/types';
import {
  condition,
  countMatches,
  difference,
  evaluate,
  group,
  intersect,
  matchingIds,
  simplify,
  union,
  type Group,
  type Rule,
} from './rules';

const NOW = new Date('2026-03-01T12:00:00.000Z');

const base: Customer = {
  id: 'x1',
  name: 'Test Person',
  email: 'test@example.com',
  plan: 'pro',
  country: 'US',
  age: 30,
  tags: ['beta', 'vip'],
  lastPurchaseAt: '2026-02-20T10:00:00.000Z', // 9 days before NOW
};

const never: Customer = { ...base, id: 'x2', tags: [], lastPurchaseAt: null };

describe('04 rules — evaluate', () => {
  it('condition() / group() build plain rule objects', () => {
    expect(condition('plan', 'eq', 'pro')).toEqual({
      kind: 'condition',
      field: 'plan',
      op: 'eq',
      value: 'pro',
    });
    expect(group('or', [], true)).toEqual({
      kind: 'group',
      op: 'or',
      not: true,
      children: [],
    });
    expect(group('and', [])).toEqual({
      kind: 'group',
      op: 'and',
      not: false,
      children: [],
    });
  });

  it('equality, ordering and membership on scalar fields', () => {
    expect(evaluate(condition('plan', 'eq', 'pro'), base)).toBe(true);
    expect(evaluate(condition('plan', 'eq', 'free'), base)).toBe(false);
    expect(evaluate(condition('country', 'neq', 'DE'), base)).toBe(true);
    expect(evaluate(condition('age', 'gt', 29), base)).toBe(true);
    expect(evaluate(condition('age', 'gt', 30), base)).toBe(false);
    expect(evaluate(condition('age', 'gte', 30), base)).toBe(true);
    expect(evaluate(condition('age', 'lt', 30), base)).toBe(false);
    expect(evaluate(condition('age', 'lte', 30), base)).toBe(true);
    expect(evaluate(condition('plan', 'in', ['free', 'pro']), base)).toBe(true);
    expect(evaluate(condition('country', 'in', ['DE', 'FR']), base)).toBe(
      false,
    );
  });

  it('tags: contains / in; lastPurchaseAt: isNull / isNotNull and null-safety', () => {
    expect(evaluate(condition('tags', 'contains', 'vip'), base)).toBe(true);
    expect(evaluate(condition('tags', 'contains', 'trial'), base)).toBe(false);
    expect(evaluate(condition('tags', 'contains', 'vip'), never)).toBe(false);
    expect(evaluate(condition('lastPurchaseAt', 'isNull'), never)).toBe(true);
    expect(evaluate(condition('lastPurchaseAt', 'isNull'), base)).toBe(false);
    expect(evaluate(condition('lastPurchaseAt', 'isNotNull'), base)).toBe(true);
    // comparisons against a null field are false, never a throw
    expect(
      evaluate(
        condition('lastPurchaseAt', 'before', '2027-01-01T00:00:00.000Z'),
        never,
      ),
    ).toBe(false);
    expect(
      evaluate(condition('lastPurchaseAt', 'after', 30), never, { now: NOW }),
    ).toBe(false);
    expect(
      evaluate(
        condition('lastPurchaseAt', 'gt', '2020-01-01T00:00:00.000Z'),
        never,
      ),
    ).toBe(false);
  });

  it('before / after accept an ISO instant or a number of days relative to ctx.now', () => {
    expect(
      evaluate(
        condition('lastPurchaseAt', 'before', '2026-02-21T00:00:00.000Z'),
        base,
      ),
    ).toBe(true);
    expect(
      evaluate(
        condition('lastPurchaseAt', 'before', '2026-02-01T00:00:00.000Z'),
        base,
      ),
    ).toBe(false);
    expect(
      evaluate(
        condition('lastPurchaseAt', 'after', '2026-02-01T00:00:00.000Z'),
        base,
      ),
    ).toBe(true);
    // purchased 9 days ago: "before 7 days" = more than 7 days ago → true; "after 7 days" = within 7 days → false
    expect(
      evaluate(condition('lastPurchaseAt', 'before', 7), base, { now: NOW }),
    ).toBe(true);
    expect(
      evaluate(condition('lastPurchaseAt', 'after', 7), base, { now: NOW }),
    ).toBe(false);
    expect(
      evaluate(condition('lastPurchaseAt', 'after', 30), base, { now: NOW }),
    ).toBe(true);
    expect(
      evaluate(condition('lastPurchaseAt', 'before', 30), base, { now: NOW }),
    ).toBe(false);
    // instant comparisons also work with gt/lt
    expect(
      evaluate(
        condition('lastPurchaseAt', 'lt', '2026-02-21T00:00:00.000Z'),
        base,
      ),
    ).toBe(true);
  });

  it('nested and / or groups with not; empty and is true, empty or is false', () => {
    expect(evaluate(group('and', []), base)).toBe(true);
    expect(evaluate(group('or', []), base)).toBe(false);
    expect(evaluate(group('and', [], true), base)).toBe(false);

    const rule: Rule = group('and', [
      condition('plan', 'eq', 'pro'),
      group('or', [
        condition('country', 'eq', 'DE'),
        condition('tags', 'contains', 'vip'),
      ]),
      group('and', [condition('age', 'lt', 18)], true), // NOT (age < 18)
    ]);
    expect(evaluate(rule, base)).toBe(true);
    expect(evaluate(rule, { ...base, tags: ['beta'] })).toBe(false);
    expect(evaluate(rule, { ...base, age: 16 })).toBe(false);
  });
});

describe('04 rules — simplify', () => {
  it('flattens same-op groups, drops empty groups, unwraps single children, dedupes conditions', () => {
    const input: Group = group('and', [
      group('and', [
        condition('plan', 'eq', 'pro'),
        group('and', [condition('age', 'gte', 18)]),
      ]),
      group('or', []),
      group('or', [condition('country', 'eq', 'US')]),
      condition('plan', 'eq', 'pro'),
      group('or', [
        condition('tags', 'contains', 'vip'),
        condition('tags', 'contains', 'beta'),
      ]),
    ]);
    const snapshot = JSON.stringify(input);

    const out = simplify(input);

    expect(out).toEqual(
      group('and', [
        condition('plan', 'eq', 'pro'),
        condition('age', 'gte', 18),
        condition('country', 'eq', 'US'),
        group('or', [
          condition('tags', 'contains', 'vip'),
          condition('tags', 'contains', 'beta'),
        ]),
      ]),
    );
    expect(JSON.stringify(input)).toBe(snapshot); // never mutates
  });

  it('keeps the root a group, keeps negated groups intact, and preserves semantics on fixtures', () => {
    const single: Group = group('or', [condition('plan', 'eq', 'free')]);
    expect(simplify(single)).toEqual(single);
    expect(simplify(group('and', []))).toEqual(group('and', []));

    const negated: Group = group('and', [
      group('and', [condition('age', 'lt', 18)], true),
    ]);
    expect(simplify(negated)).toEqual(negated);

    const messy: Group = group('or', [
      group('or', [
        group('or', [condition('country', 'in', ['US', 'GB'])]),
        group('or', []),
      ]),
      group('and', [
        condition('plan', 'eq', 'enterprise'),
        condition('plan', 'eq', 'enterprise'),
      ]),
    ]);
    const simple = simplify(messy);
    expect(simple).toEqual(
      group('or', [
        condition('country', 'in', ['US', 'GB']),
        condition('plan', 'eq', 'enterprise'),
      ]),
    );
    expect(matchingIds(simple, customers)).toEqual(
      matchingIds(messy, customers),
    );
  });
});

describe('04 rules — matching and set algebra', () => {
  it('countMatches / matchingIds agree with a plain filter over the fixtures and are sorted', () => {
    const rule: Rule = group('and', [
      condition('plan', 'in', ['pro', 'enterprise']),
      group('or', [
        condition('country', 'eq', 'US'),
        condition('tags', 'contains', 'vip'),
      ]),
      condition('lastPurchaseAt', 'after', 180),
    ]);
    const expected = customers
      .filter(
        (c) =>
          (c.plan === 'pro' || c.plan === 'enterprise') &&
          (c.country === 'US' || c.tags.includes('vip')) &&
          c.lastPurchaseAt !== null &&
          Date.parse(c.lastPurchaseAt) > NOW.getTime() - 180 * 86_400_000,
      )
      .map((c) => c.id)
      .sort();

    expect(expected.length).toBeGreaterThan(0);
    expect(expected.length).toBeLessThan(customers.length);
    expect(countMatches(rule, customers, { now: NOW })).toBe(expected.length);
    expect(matchingIds(rule, customers, { now: NOW })).toEqual(expected);
    expect(countMatches(group('and', []), customers)).toBe(customers.length);
    expect(countMatches(group('or', []), customers)).toBe(0);
  });

  it('intersect / union / difference over sorted id lists', () => {
    const a = ['a', 'c', 'e', 'g'];
    const b = ['b', 'c', 'd', 'g', 'h'];
    expect(intersect(a, b)).toEqual(['c', 'g']);
    expect(union(a, b)).toEqual(['a', 'b', 'c', 'd', 'e', 'g', 'h']);
    expect(difference(a, b)).toEqual(['a', 'e']);
    expect(difference(b, a)).toEqual(['b', 'd', 'h']);
    expect(intersect([], b)).toEqual([]);
    expect(union([], b)).toEqual(b);
    expect(union(a, [])).toEqual(a);
    expect(difference([], b)).toEqual([]);
    expect(difference(a, [])).toEqual(a);

    const pro = matchingIds(condition('plan', 'eq', 'pro'), customers);
    const us = matchingIds(condition('country', 'eq', 'US'), customers);
    expect(intersect(pro, us)).toEqual(
      matchingIds(
        group('and', [
          condition('plan', 'eq', 'pro'),
          condition('country', 'eq', 'US'),
        ]),
        customers,
      ),
    );
    expect(union(pro, us)).toEqual(
      matchingIds(
        group('or', [
          condition('plan', 'eq', 'pro'),
          condition('country', 'eq', 'US'),
        ]),
        customers,
      ),
    );
    expect(difference(pro, us)).toEqual(
      matchingIds(
        group('and', [
          condition('plan', 'eq', 'pro'),
          condition('country', 'neq', 'US'),
        ]),
        customers,
      ),
    );
  });
});
