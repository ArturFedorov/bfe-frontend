# 083. Rule Tree Evaluate

**Difficulty:** Easy
**Topics:** Trees, Recursion, Boolean Logic, Structural Sharing

---

## Description

A marketing-automation platform lets users build **segments** with a visual
rule builder: "country equals `US` AND (plan is one of `pro`, `team` OR
lifetime spend greater than 500)". The builder saves that as a tree. Leaves
are `Rule`s (`field operator value`); inner nodes are `Group`s that combine
their children with `AND` or `OR`. Groups nest arbitrarily.

Two parts:

1. `evaluate(node, record)` decides whether one contact `record` belongs to
   the segment. Operator semantics:
   - A field missing from the record (`undefined`) makes **any** rule on it
     `false` — including `neq`.
   - `eq` / `neq`: strict `===` comparison of primitives, no coercion
     (`'5'` is not `5`). `neq` is the negation of `eq` for a *present* field.
     If either side is an array both operators are `false`.
   - `gt` / `lt`: only when **both** the record value and the rule value are
     numbers; anything else is `false`.
   - `contains`: for a `string` record value — substring test; for a
     `string[]` record value — element membership. The rule value must be a
     string, else `false`.
   - `in`: the record value is a `string` that appears in the rule's
     `string[]` value. If the rule value is not an array, `false`.
   - Groups: `AND` is true when **every** child is true (an empty `AND` is
     `true`); `OR` is true when **some** child is true (an empty `OR` is
     `false`). Stop evaluating children as soon as the result is known.
2. `simplify(node)` normalises the trees the builder produces when users drag
   rules around and delete things:
   - **Flatten** a child group that has the same `op` as its parent — its
     children move up into the parent, in place.
   - **Drop** child groups that end up with no children (builder leftovers).
   - **Collapse** a group with exactly one child to that child.
   - Apply these bottom-up, so a chain like `AND[AND[AND[a]]]` becomes `a`.
   - **Never mutate** the input. When nothing about a subtree changes, return
     the **same reference** — callers diff trees by identity to skip re-saves.
     A `Rule` is always returned as-is.

## Examples

```ts
const tree: Node = {
  kind: 'group',
  op: 'AND',
  children: [
    { kind: 'rule', field: 'country', operator: 'eq', value: 'US' },
    {
      kind: 'group',
      op: 'OR',
      children: [
        { kind: 'rule', field: 'plan', operator: 'in', value: ['pro', 'team'] },
        { kind: 'rule', field: 'spend', operator: 'gt', value: 500 },
      ],
    },
  ],
};

evaluate(tree, { country: 'US', plan: 'free', spend: 900 }); // true  (spend wins the OR)
evaluate(tree, { country: 'US', plan: 'free', spend: 100 }); // false
evaluate(tree, { plan: 'pro', spend: 900 });                 // false (country missing)

const messy: Node = {
  kind: 'group',
  op: 'AND',
  children: [
    { kind: 'group', op: 'AND', children: [] },                        // dropped
    {
      kind: 'group',
      op: 'AND',                                                        // same op: flattened
      children: [
        { kind: 'rule', field: 'a', operator: 'eq', value: 1 },
        { kind: 'group', op: 'OR', children: [                           // single child: collapsed
          { kind: 'rule', field: 'b', operator: 'eq', value: 2 },
        ] },
      ],
    },
  ],
};

simplify(messy);
// { kind: 'group', op: 'AND', children: [ rule a, rule b ] }

const clean = simplify(messy);
simplify(clean) === clean; // true — already normal, same reference
```

## Constraints

- `1 <= number of nodes <= 10_000`; nesting depth `<= 500`.
- Record values are `string | number | string[] | undefined`; rule values are
  `string | number | string[]`.
- `evaluate` must not throw for any operator / value-type combination — type
  mismatches are simply `false`.
- `simplify` never mutates its input and returns the identical reference when
  the subtree is already in normal form.

## Target

O(n) time for both functions, where n is the number of nodes. Recursion is
fine at depth 500.

The shape to reach for in `simplify`:

```
simplify(group):
  changed = false
  out = []
  for child in group.children:
    s = simplify(child)
    if s !== child: changed = true
    if s is group and s.children is empty: changed = true; continue
    if s is group and s.op === group.op: changed = true; out.push(...s.children); continue
    out.push(s)
  if out.length === 1: return out[0]
  return changed ? { ...group, children: out } : group
```

Senior signal: processing children **before** deciding about the parent
(so a nested single-child group collapses into a rule, and *that* rule is
what gets spliced into the grandparent), and tracking `changed` instead of
always allocating.

## Interviewer follow-up

Dropping an empty `OR` group from an `AND` parent is not semantics-preserving
(an empty `OR` evaluates to `false`, which would have made the whole `AND`
false). The product team says "empty groups are builder noise". Where would
you put that decision — in `simplify`, in the builder's save path, or in
`evaluate`? How would you make `simplify` provably semantics-preserving
instead, and what would it return for `AND[ OR[] ]`?
