# 35. Implement Immutable Update Helpers

**Difficulty:** Medium

**Topics:** JavaScript Utilities, Functional Programming, Immutability, Structural Sharing

---

## Description

Implement `getIn`, `setIn` and `updateIn` for reading and updating nested data without mutation. The update helpers return a **new** root object and copy only the containers along the path; every untouched sibling keeps its identity (structural sharing). This is the pattern reducers and state libraries rely on so `===` checks can skip unchanged subtrees.

```typescript
type Path = (string | number)[];

function getIn<T = unknown>(
  obj: unknown,
  path: Path,
  defaultValue?: T,
): T | undefined;

function setIn<T>(obj: T, path: Path, value: unknown): T;

function updateIn<T>(
  obj: T,
  path: Path,
  updater: (current: unknown) => unknown,
): T;
```

Rules:

- `getIn` returns `defaultValue` when any step is `null`/`undefined` or when the final value is `undefined`
- `setIn`/`updateIn` create missing intermediate containers: a numeric next key means an array, otherwise a plain object
- Arrays along the path stay arrays (copy with `slice`, not object spread)
- An empty path means the root itself: `setIn(obj, [], v)` returns `v`, `updateIn(obj, [], f)` returns `f(obj)`
- The input is never mutated, even when it is frozen

---

## Examples

### Example 1

```typescript
const state = { user: { name: 'Ada', tags: ['a'] }, theme: 'dark' };

getIn(state, ['user', 'tags', 0]); // 'a'
getIn(state, ['user', 'age'], 0); // 0
```

### Example 2

```typescript
const next = setIn(state, ['user', 'name'], 'Grace');

next.user.name; // 'Grace'
next !== state; // true
next.user !== state.user; // true
next.user.tags === state.user.tags; // true (untouched sibling)
```

### Example 3

```typescript
const next = updateIn(state, ['user', 'tags'], (tags) => [
  ...(tags as string[]),
  'b',
]);
next.user.tags; // ['a', 'b']

setIn({}, ['list', 1, 'id'], 7); // { list: [ <empty>, { id: 7 } ] }
```

---

## Constraints

- Only containers on the path are copied; everything else is shared by reference
- Never mutate the input (tests freeze it)
- Numeric path keys create arrays; string keys create objects

---

## Approach Hints

<details><summary>Hint 1</summary>
Write `setIn` recursively: handle `path.length === 0` by returning `value`; otherwise copy the current container, assign `copy[head] = setIn(current?.[head], rest, value)` and return the copy.
</details>

<details><summary>Hint 2</summary>
When the current container is missing, decide what to create by looking at the type of `head`: `typeof head === 'number'` gives `[]`, else `{}`.
</details>

<details><summary>Hint 3</summary>
`updateIn(obj, path, f)` is `setIn(obj, path, f(getIn(obj, path)))`.
</details>

---

## Related Problems

- Implement Deep Clone
- Implement Deep Freeze
