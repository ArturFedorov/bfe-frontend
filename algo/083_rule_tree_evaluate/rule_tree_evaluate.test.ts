import {
  evaluate,
  simplify,
  Node,
  Rule,
  Group,
  Record,
} from './rule_tree_evaluate';

const rule = (
  field: string,
  operator: Rule['operator'],
  value: Rule['value'],
): Rule => ({ kind: 'rule', field, operator, value });

const group = (op: Group['op'], children: Node[]): Group => ({
  kind: 'group',
  op,
  children,
});

const contact: Record = {
  country: 'US',
  plan: 'pro',
  spend: 750,
  tags: ['vip', 'newsletter'],
  email: 'ada@example.com',
};

describe('evaluate — operators', () => {
  it('eq / neq compare primitives strictly', () => {
    expect(evaluate(rule('country', 'eq', 'US'), contact)).toBe(true);
    expect(evaluate(rule('country', 'eq', 'CA'), contact)).toBe(false);
    expect(evaluate(rule('spend', 'eq', 750), contact)).toBe(true);
    expect(evaluate(rule('spend', 'eq', '750'), contact)).toBe(false); // no coercion
    expect(evaluate(rule('country', 'neq', 'CA'), contact)).toBe(true);
    expect(evaluate(rule('country', 'neq', 'US'), contact)).toBe(false);
  });

  it('eq on an array value is false; neq on it is true', () => {
    expect(evaluate(rule('tags', 'eq', 'vip'), contact)).toBe(false);
    expect(evaluate(rule('country', 'eq', ['US']), contact)).toBe(false);
    expect(evaluate(rule('tags', 'neq', 'vip'), contact)).toBe(true);
  });

  it('gt / lt work only for number vs number', () => {
    expect(evaluate(rule('spend', 'gt', 500), contact)).toBe(true);
    expect(evaluate(rule('spend', 'gt', 750), contact)).toBe(false);
    expect(evaluate(rule('spend', 'lt', 1000), contact)).toBe(true);
    expect(evaluate(rule('spend', 'lt', 10), contact)).toBe(false);
    expect(evaluate(rule('spend', 'gt', '500'), contact)).toBe(false);
    expect(evaluate(rule('country', 'gt', 1), contact)).toBe(false);
    expect(evaluate(rule('tags', 'lt', 5), contact)).toBe(false);
  });

  it('contains does substring on strings and membership on arrays', () => {
    expect(evaluate(rule('email', 'contains', '@example'), contact)).toBe(true);
    expect(evaluate(rule('email', 'contains', '@other'), contact)).toBe(false);
    expect(evaluate(rule('tags', 'contains', 'vip'), contact)).toBe(true);
    expect(evaluate(rule('tags', 'contains', 'vi'), contact)).toBe(false); // no partial on elements
    expect(evaluate(rule('spend', 'contains', '7'), contact)).toBe(false); // number: false
    expect(evaluate(rule('email', 'contains', 5), contact)).toBe(false); // non-string rule value
  });

  it('in checks membership of a string record value in the rule array', () => {
    expect(evaluate(rule('plan', 'in', ['pro', 'team']), contact)).toBe(true);
    expect(evaluate(rule('plan', 'in', ['free']), contact)).toBe(false);
    expect(evaluate(rule('plan', 'in', 'pro'), contact)).toBe(false); // value not an array
    expect(evaluate(rule('tags', 'in', ['vip']), contact)).toBe(false); // array record value
    expect(evaluate(rule('spend', 'in', ['750']), contact)).toBe(false);
  });

  it('a missing field is false for every operator, including neq', () => {
    const ops: Rule['operator'][] = ['eq', 'neq', 'gt', 'lt', 'contains', 'in'];
    for (const op of ops) {
      expect(
        evaluate(rule('missing', op, op === 'in' ? ['x'] : 'x'), contact),
      ).toBe(false);
    }
    expect(
      evaluate(rule('explicit', 'neq', 'x'), { explicit: undefined }),
    ).toBe(false);
  });
});

describe('evaluate — groups', () => {
  it('AND requires every child, OR requires some child', () => {
    const and = group('AND', [
      rule('country', 'eq', 'US'),
      rule('spend', 'gt', 500),
    ]);
    const or = group('OR', [
      rule('country', 'eq', 'CA'),
      rule('spend', 'gt', 500),
    ]);
    expect(evaluate(and, contact)).toBe(true);
    expect(evaluate(or, contact)).toBe(true);
    expect(evaluate(and, { ...contact, spend: 10 })).toBe(false);
    expect(evaluate(or, { ...contact, spend: 10 })).toBe(false);
  });

  it('empty AND is true, empty OR is false', () => {
    expect(evaluate(group('AND', []), {})).toBe(true);
    expect(evaluate(group('OR', []), {})).toBe(false);
  });

  it('evaluates nested groups', () => {
    const tree = group('AND', [
      rule('country', 'eq', 'US'),
      group('OR', [rule('plan', 'in', ['team']), rule('spend', 'gt', 500)]),
    ]);
    expect(evaluate(tree, contact)).toBe(true);
    expect(evaluate(tree, { ...contact, spend: 100 })).toBe(false);
    expect(evaluate(tree, { plan: 'team', spend: 900 })).toBe(false);
  });

  it('short-circuits: AND stops at the first false, OR at the first true', () => {
    const seen: string[] = [];
    const spy: Record = {};
    for (const f of ['f1', 'f2']) {
      Object.defineProperty(spy, f, {
        enumerable: true,
        get: () => {
          seen.push(f);
          return f === 'f1' ? 1 : 2;
        },
      });
    }
    expect(
      evaluate(group('AND', [rule('f1', 'eq', 0), rule('f2', 'eq', 2)]), spy),
    ).toBe(false);
    expect(seen).toEqual(['f1']);

    seen.length = 0;
    expect(
      evaluate(group('OR', [rule('f2', 'eq', 2), rule('f1', 'eq', 1)]), spy),
    ).toBe(true);
    expect(seen).toEqual(['f2']);
  });
});

describe('simplify', () => {
  it('returns a rule as the same reference', () => {
    const r = rule('a', 'eq', 1);
    expect(simplify(r)).toBe(r);
  });

  it('returns the same reference for a group already in normal form', () => {
    const g = group('AND', [
      rule('a', 'eq', 1),
      group('OR', [rule('b', 'eq', 2), rule('c', 'eq', 3)]),
    ]);
    expect(simplify(g)).toBe(g);
    expect((simplify(g) as Group).children[1]).toBe(g.children[1]);
  });

  it('flattens a nested group with the same op', () => {
    const a = rule('a', 'eq', 1);
    const b = rule('b', 'eq', 2);
    const c = rule('c', 'eq', 3);
    expect(simplify(group('AND', [a, group('AND', [b, c])]))).toEqual(
      group('AND', [a, b, c]),
    );
  });

  it('keeps a nested group with a different op', () => {
    const inner = group('OR', [rule('b', 'eq', 2), rule('c', 'eq', 3)]);
    const g = group('AND', [rule('a', 'eq', 1), inner]);
    const out = simplify(g) as Group;
    expect(out.children[1]).toBe(inner);
  });

  it('drops empty child groups', () => {
    const a = rule('a', 'eq', 1);
    const b = rule('b', 'eq', 2);
    expect(
      simplify(group('AND', [group('OR', []), a, group('AND', []), b])),
    ).toEqual(group('AND', [a, b]));
  });

  it('collapses a single-child group to the child', () => {
    const a = rule('a', 'eq', 1);
    expect(simplify(group('OR', [a]))).toBe(a);
    const inner = group('OR', [rule('b', 'eq', 2), rule('c', 'eq', 3)]);
    expect(simplify(group('AND', [inner]))).toBe(inner);
  });

  it('returns an empty group when every child was an empty group', () => {
    const out = simplify(group('AND', [group('OR', []), group('AND', [])]));
    expect(out).toEqual(group('AND', []));
  });

  it('handles deep nesting bottom-up: AND[AND[AND[a]]] becomes a', () => {
    const a = rule('a', 'eq', 1);
    expect(simplify(group('AND', [group('AND', [group('AND', [a])])]))).toBe(a);
  });

  it('flattens a 500-deep same-op chain into one flat group', () => {
    const leaves: Rule[] = [];
    let node: Node = group('AND', []);
    for (let i = 0; i < 500; i++) {
      const leaf = rule(`f${i}`, 'eq', i);
      leaves.push(leaf);
      node = group('AND', [leaf, node]);
    }
    const out = simplify(node) as Group;
    expect(out.kind).toBe('group');
    expect(out.children).toHaveLength(500);
    expect(out.children[0]).toBe(leaves[499]);
    expect(out.children[499]).toBe(leaves[0]);
  });

  it('collapses a single-child chain that ends in a mixed group', () => {
    const inner = group('OR', [
      rule('x', 'eq', 1),
      group('AND', [rule('y', 'eq', 2)]),
    ]);
    const out = simplify(group('AND', [group('OR', [inner])]));
    expect(out).toEqual(group('OR', [rule('x', 'eq', 1), rule('y', 'eq', 2)]));
  });

  it('does not mutate the input', () => {
    const inner = group('AND', [rule('b', 'eq', 2)]);
    const g = group('AND', [rule('a', 'eq', 1), inner, group('OR', [])]);
    const snapshot = JSON.parse(JSON.stringify(g));
    simplify(g);
    expect(g).toEqual(snapshot);
    expect(g.children[1]).toBe(inner);
  });

  it('preserves identity of untouched subtrees inside a changed parent', () => {
    const untouched = group('OR', [rule('b', 'eq', 2), rule('c', 'eq', 3)]);
    const g = group('AND', [untouched, group('AND', [])]);
    const out = simplify(g);
    expect(out).toBe(untouched); // the empty group drops, leaving one child → collapsed
    const g2 = group('AND', [untouched, rule('a', 'eq', 1), group('AND', [])]);
    const out2 = simplify(g2) as Group;
    expect(out2).not.toBe(g2);
    expect(out2.children[0]).toBe(untouched);
  });

  it('simplified tree evaluates the same as the original', () => {
    const messy = group('AND', [
      group('AND', []),
      group('AND', [
        rule('country', 'eq', 'US'),
        group('OR', [
          group('OR', [rule('plan', 'in', ['pro']), rule('spend', 'gt', 500)]),
        ]),
      ]),
    ]);
    const clean = simplify(messy);
    const records: Record[] = [
      contact,
      { ...contact, plan: 'free', spend: 100 },
      { ...contact, country: 'CA' },
      {},
    ];
    for (const r of records)
      expect(evaluate(clean, r)).toBe(evaluate(messy, r));
    expect(simplify(clean)).toBe(clean);
  });
});
