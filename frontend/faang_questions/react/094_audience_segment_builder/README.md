# 094. Audience Segment Builder

**Difficulty:** Hard
**Estimated time:** 60 minutes
**Topics:** Recursive Data Structures, Controlled Components, Structural Sharing, Pure Evaluation, Form Accessibility

---

## Scenario

Marketing ops builds audiences for campaigns with nested conditions such as
"country is Germany AND (orders > 10 OR plan is free)". The current builder
stores the tree in component state, so the parent form cannot save it, undo
is impossible, and the "N customers match" preview recomputes on a timer and
lags. Build a fully controlled segment builder over a recursive
`Group → (Rule | Group)[]` tree with a pure evaluator that drives a live
match count from a sample of customers.

Everything lives in `segment_builder.tsx`: the types, pure `evaluate`,
`countMatches`, `operatorsForType`, and the `SegmentBuilder` component.

## Requirements

1. `operatorsForType(type)` returns, in display order, `['eq','neq','gt','lt']`
   for `number`, `['eq','neq','in']` for `enum`, and
   `['eq','neq','contains','in']` for `string`. The first entry is the default
   operator for that type.
2. `evaluate(node, customer)`:
   - a missing field (`customer[field] === undefined`) is `false` for every
     operator, including `neq`;
   - `eq` / `neq` compare primitives with strict equality (no coercion:
     `12 !== '12'`); array values on either side → `false`;
   - `gt` / `lt` require numbers on both sides, otherwise `false`;
   - `contains`: string field → case-insensitive substring; array field →
     element equality; array rule value → `false`;
   - `in`: rule value is a list (a non-array value is treated as a
     one-element list); array field → any overlap; primitive field →
     membership by string comparison; empty list → `false`;
   - groups: `AND` → every child, `OR` → some child; an empty `AND` group
     matches everyone, an empty `OR` group matches no one.
3. `countMatches(group, customers)` counts customers for which the root
   evaluates to `true`.
4. `SegmentBuilder` is fully controlled: it never stores the tree; every edit
   calls `onChange(nextRoot)` once. Nothing in `value` is mutated.
5. Structural sharing: `onChange` receives a new root whose path to the
   edited node is copied and every untouched sibling / subtree is the same
   object reference as before (`toBe`).
6. Each group renders as `role="group"` with accessible name `Group (AND)` or
   `Group (OR)`, and a toolbar (before its children) with buttons
   `Match all` (when `AND`) / `Match any` (when `OR`) that toggles `op`,
   `Add rule`, `Add group`, and `Remove` — the root has no `Remove`.
7. `Add rule` appends `{ id: newId(), kind: 'rule', field: fields[0].name,
   operator: default for that type, value: default }` to that group;
   `Add group` appends `{ id: newId(), kind: 'group', op: 'AND', children: [] }`.
   `Remove` deletes exactly that node. `newId` defaults to
   `crypto.randomUUID()`.
8. Each rule row has a `<select>` labelled `Field` (options = field labels,
   values = field names), a `<select>` labelled `Operator` listing only
   `operatorsForType(fieldType)`, and a control labelled `Value`:
   `<input type="number">` for number fields, `<select>` of the enum
   options for enum fields, `<input type="text">` otherwise. With operator
   `in`: enum → `<select multiple>` storing `string[]`; string → text input
   that splits on commas into `string[]`.
9. Changing `Field` resets the rule to that type's default operator and
   default value (`0` for number, first option for enum, `''` for string,
   `[]` for `in`). Changing `Operator` between a list operator (`in`) and a
   scalar one resets the value to the matching default; otherwise the value
   is kept.
10. A `role="status"` element reads exactly `N of M customers match`,
    recomputed from `evaluate` on every render (no effects, no timers).
11. Selecting the already-selected field or operator must not emit `onChange`.

## Acceptance Criteria

- [ ] `evaluate`: eq/neq/gt/lt on numbers and strings, no coercion, missing
      field → `false` even for `neq`.
- [ ] `evaluate`: `contains` on strings (case-insensitive) and arrays; `in`
      on enum strings and array fields; empty list → `false`.
- [ ] `evaluate`: nested AND/OR; empty AND → `true`, empty OR → `false`.
- [ ] `countMatches` over the sample customers.
- [ ] `operatorsForType` lists per type with `eq` first.
- [ ] Rendering: nested group inside root, both labelled by op; three rule
      rows with labelled `Field`/`Operator`/`Value`; number input and enum
      select chosen by type; status `2 of 5 customers match`.
- [ ] Root toolbar is `Match all`, `Add rule`, `Add group` (no `Remove`);
      nested group and every rule have `Remove`.
- [ ] Operator options per row follow the field type.
- [ ] Toggle: `onChange` once with `op: 'OR'`, label and count update.
- [ ] Structural sharing: editing a nested value keeps `children[0]` and the
      untouched nested sibling by identity; toggling the nested group keeps
      the root's other child by identity.
- [ ] Field change → `{ field, operator: 'eq', value: 0 }` for number, enum
      select with options and first option as value; operator `in` →
      multi-select storing `['pro','team']`.
- [ ] `Add rule` / `Add group` target the clicked group and use `newId`
      (`new-1`, `new-2`); `Remove` on the nested group drops it; removing the
      last rule yields `5 of 5 customers match`.
- [ ] No-op selections do not call `onChange`; the input tree is never
      mutated.
- [ ] Tab order: `Match all`, `Add rule`, `Add group`, `Field`, `Operator`,
      `Value`, `Remove`, all native elements.

## Baseline a11y

- Groups are `<fieldset role="group" aria-label="Group (AND|OR)">`.
- Every control is a native `<button>`, `<select>` or `<input>` wrapped in a
  `<label>` whose own text is `Field`, `Operator` or `Value`.
- The toggle exposes its state (`aria-pressed` or the visible text);
  the match count is a polite `role="status"` live region.
- No custom key handling needed: native controls provide keyboard support.

## Constraints

- React + TypeScript only; no third-party libraries.
- Keep the exported types exactly; do not add a `kind` other than `rule` and
  `group`.
- No `useEffect` to sync props to state and no internal copy of `value`.
- `evaluate` and `countMatches` must be pure and must not touch the DOM.

## Interviewer follow-ups (talk-through, not implemented)

- Drag-and-drop a rule into another group: what does the update function
  look like when two paths change at once, and how do you keep structural
  sharing?
- 100k sample customers: where would you move `countMatches` (worker,
  memo keyed by tree identity, server estimate) and how do you show staleness?
- Serialize the tree to a backend query language (SQL `WHERE`, Elasticsearch
  bool query): which operators map cleanly and which need type information?
- Validation: an `in` with an empty list or a number input left blank — block
  save, show inline errors, or treat as "no constraint"?

## Say out loud

- State shape first: the recursive discriminated union `Rule | Group`, with
  ids on every node so updates can target a node without indices.
- Name the race/cleanup hazard: there is no async here — the hazard is
  mutation: a path-copy update must return the same reference for untouched
  subtrees or `React.memo` on rows is useless and `onChange` spams parents.
- Ask one data-shape question: "Can a customer field be an array for a field
  declared `string` (tags), and should `eq` on it be `false` or 'any equals'?"
- Ask one failure-handling question: "A saved rule references a field that no
  longer exists in `fields` — render it read-only, drop it, or mark invalid?"
- Name the first test you'd write: "`evaluate` returns `false` for a missing
  field even with `neq`."
