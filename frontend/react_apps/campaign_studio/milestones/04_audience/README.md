# Milestone 04. Audience Rules + Segment Builder

**Difficulty:** Medium
**Estimated time:** 2 evenings (rules: 1, builder: 1)
**Topics:** Recursive data structures, predicate evaluation, tree normalisation, sorted-set algebra, recursive React editors, derived state

---

## Scenario

Marketing ops define an audience as a tree of rules — "pro or enterprise
customers in the US *or* tagged `vip`, who bought something in the last 180
days". Today they do it in a spreadsheet and a data engineer turns it into SQL
twice a week. Build the rule engine (`rules.ts`) and a nested AND/OR editor
(`SegmentBuilder.tsx`) that shows how many of the 60 fixture customers match
*while they type*.

Two files, two evenings:

- `rules.ts` — pure functions over `Rule` trees and `Customer` records.
- `SegmentBuilder.tsx` — the editor, which calls `countMatches` on every edit.

## How it plugs into the app

The **Audiences** tab in `app/App.tsx` renders `<SegmentBuilder />` inside a
`TaskBoundary`; until you implement it the tab shows this assignment card. The
component loads customers once with `shell/api` `listCustomers()` and never
calls anything else. Tests pass their own `createApi({ latencyMs: 0 })`.

## Requirements — `rules.ts`

1. `condition(field, op, value?)` and `group(op, children, not = false)` return
   plain objects (`kind: 'condition' | 'group'`). `condition` omits `value` when
   it is `undefined`; `group` always writes `not`.
2. `evaluate(rule, customer, ctx?)`:
   - `eq`, `neq`, `gt`, `gte`, `lt`, `lte` compare the field to `value`;
     `in` is true when `value` (an array) contains the field;
   - `tags`: `contains` is true when the array includes `value`;
   - `lastPurchaseAt`: `gt/gte/lt/lte/eq/neq` compare instants parsed from ISO
     strings. `before` / `after` accept an ISO string **or a number of days**
     relative to `ctx.now` (default `new Date()`): `before 7` = purchased more
     than 7 days ago, `after 7` = within the last 7 days;
   - `isNull` / `isNotNull` test for `null`/`undefined`; every other operator
     against a `null` field is `false` — never throw;
   - an empty `and` group is `true`, an empty `or` group is `false`; `not`
     negates the group's result.
3. `simplify(rule)` returns a new tree (never mutates the input):
   - nested groups with the same `op` and no `not` are flattened into the parent;
   - empty groups are removed from their parent (an empty root is returned
     as-is). An empty group means "nothing configured yet" in the editor; this
     is the one rewrite that can change `evaluate`'s result (empty `and` inside
     `or`) — say so when you present it;
   - a group with a single child and no `not` is replaced by that child, except
     at the root, which stays a group;
   - duplicate conditions (same `field`, `op`, `value`) inside a group are dropped;
   - negated groups are kept as-is (only their children are simplified).
4. `countMatches(rule, customers, ctx?)` counts customers for which `evaluate`
   is true; `matchingIds` returns their ids **sorted ascending**.
5. `intersect`, `union`, `difference` take sorted, duplicate-free id arrays and
   return sorted arrays in one linear pass (two pointers). Empty inputs work.

## Requirements — `SegmentBuilder.tsx`

6. On mount call `api.listCustomers()` once. While loading, the `role="status"`
   element reads `Loading customers…`; afterwards it reads
   `N of M customers match` and updates synchronously after every edit.
7. The root is an `and` group (or `initialRule`). Every group renders a
   `<fieldset role="group">` with a `<select aria-label="Group operator">`
   (`and` / `or`), an `Add condition` button and an `Add group` button. Nested
   groups add a `Remove group` button; the root has none.
8. A new condition is `{ field: 'plan', op: 'eq', value: '' }`. Each condition
   row has `<select aria-label="Field">` (the five `RuleField`s),
   `<select aria-label="Operator">` (only operators valid for that field), an
   `<input aria-label="Value">` and a `Remove` button. Changing the field
   resets the operator to the first valid one when the current one is invalid.
9. Value parsing: `age` → number; `in` → comma-separated list; `lastPurchaseAt`
   `before`/`after` → number of days when the input is all digits, otherwise the
   string as an ISO instant. `isNull` / `isNotNull` hide the value input and
   store no `value`.
10. `onChange(rule)` is called with the full root group after every edit (not
    simplified — the editor keeps the user's structure).
11. `now` (default `() => new Date()`) is passed to `countMatches` so relative
    date rules are deterministic in tests.

## Acceptance Criteria

- [ ] `evaluate` handles every operator, `in` with arrays, `contains` on tags,
      relative and absolute `before`/`after`, and `null` fields without throwing.
- [ ] Empty `and` → true, empty `or` → false, `not` negates; groups nest.
- [ ] `simplify` flattens, removes empty groups, unwraps singletons (not the
      root), dedupes, keeps negated groups, and does not mutate.
- [ ] `countMatches` / `matchingIds` agree with a plain `filter` over the fixtures;
      ids sorted.
- [ ] `intersect` / `union` / `difference` match set semantics on sorted inputs,
      including empty arrays.
- [ ] Builder: root group with operator select + two add buttons; status reads
      `60 of 60 customers match` for an empty root.
- [ ] Adding a condition and typing `plan eq pro` recounts and calls `onChange`
      with the tree; `age gte 40` stores the number `40`.
- [ ] Switching the root to `or` and removing a condition recount correctly.
- [ ] A nested group has its own operator select, add buttons and `Remove group`;
      `isNull` hides the value input.

## Baseline a11y

- Live count in a `role="status"` element (polite live region).
- Every group is a `fieldset` with `role="group"` and an accessible name
  (`Root group` / `Nested group`).
- Every control is a real `<select>` / `<input>` / `<button>` with an accessible
  name: `Group operator`, `Field`, `Operator`, `Value`, `Add condition`,
  `Add group`, `Remove`, `Remove group`.

## Constraints

- React + TypeScript only; no libraries.
- Keep the exported types and signatures as given (`app/App.tsx` imports
  `SegmentBuilder` with no props).
- Set algebra must be linear in `a.length + b.length` — no `includes` inside a loop.
- `evaluate` must not allocate per customer beyond what the comparison needs;
  `countMatches` over 60 customers runs on every keystroke.

## Interviewer follow-ups (talk-through, not implemented)

- 60 customers is a fixture. With 6 million, where does `countMatches` run and
  what does the UI show while it is running? (Debounce, server-side count,
  cancellation of a stale count.)
- How would you serialise the tree to a stable string so two equivalent rules
  share a cache key? Does `simplify` help?
- The `not` flag lives on groups only. What changes if conditions can be
  negated too — in `evaluate`, in `simplify`, in the UI?
- Segments compose: "A minus B". Why are the sorted-id set functions enough,
  and when would you switch to a bitset?

## Say out loud

- Walk the tree once per customer: `evaluate` is `O(nodes)`; `countMatches` is
  `O(customers × nodes)`.
- Name the `null` rule before writing operators: "`isNull` is the only operator
  that is true for a missing field; everything else is false."
- Name the identity elements: empty `and` is `true`, empty `or` is `false` —
  that is why `simplify` removing an empty group is a product decision, not a
  logical one.
- For the builder: "state is one tree; every edit is `updateAt(path, fn)`
  producing a new tree; count and `onChange` derive from it."
- First test you would write: "`before 7` with a purchase 9 days ago is true,
  `after 7` is false."
