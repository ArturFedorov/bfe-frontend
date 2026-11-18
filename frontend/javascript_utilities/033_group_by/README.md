# 33. Implement GroupBy

**Difficulty:** Easy

**Topics:** JavaScript Utilities, Functional Programming, Data Transformation

---

## Description

Implement `groupBy`, which splits an array into buckets keyed by the result of an iteratee. The iteratee is either a function or a property name (shorthand). Every key is coerced to a string, so `1` and `'1'` land in the same bucket and a missing value groups under `'undefined'`.

```typescript
function groupBy<T>(
  items: T[],
  key: keyof T | ((item: T) => unknown),
): Record<string, T[]>;
```

Items inside a bucket keep their original relative order, and buckets appear in the order their key was first seen (subject to the JavaScript rule that integer-like keys are listed first in ascending order).

---

## Examples

### Example 1

```typescript
groupBy([6.1, 4.2, 6.3], Math.floor);
// { '6': [6.1, 6.3], '4': [4.2] }
```

### Example 2

```typescript
const shows = [
  { title: 'Dark', genre: 'sci-fi' },
  { title: 'Ozark', genre: 'drama' },
  { title: 'Arrival', genre: 'sci-fi' },
];

groupBy(shows, 'genre');
// { 'sci-fi': [Dark, Arrival], drama: [Ozark] }
```

### Example 3

```typescript
groupBy([{ a: 1 }, {}], 'a');
// { '1': [{ a: 1 }], undefined: [{}] }
```

---

## Constraints

- Return a plain object with string keys
- Do not mutate the input array; every bucket is a new array
- Keys that collide with `Object.prototype` members (`'constructor'`, `'toString'`) must still work
- Empty input returns `{}`

---

## Approach Hints

<details><summary>Hint 1</summary>
Normalize the iteratee first: a property name becomes `(item) => item[name]`. Then there is one code path.
</details>

<details><summary>Hint 2</summary>
`String(value)` gives `'undefined'`, `'null'`, `'true'` as expected. Template strings do too.
</details>

<details><summary>Hint 3</summary>
`result[key] ||= []` finds `Object.prototype.toString` for the key `'toString'`. Guard with `Object.prototype.hasOwnProperty.call(result, key)` or build the result with `Object.create(null)`.
</details>

---

## Related Problems

- Implement Array.prototype.reduce
- Implement CountBy and KeyBy
