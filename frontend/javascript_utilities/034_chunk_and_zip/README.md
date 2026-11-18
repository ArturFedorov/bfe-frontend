# 34. Implement Chunk, Zip and Unzip

**Difficulty:** Easy

**Topics:** JavaScript Utilities, Functional Programming, Arrays

---

## Description

Implement three array-shaping helpers.

- `chunk(arr, size)` splits `arr` into consecutive groups of `size`. The last group holds whatever remains. `size` must be a positive integer; otherwise throw a `RangeError`.
- `zip(...arrays)` pairs elements by index into tuples. The result is as long as the **shortest** input; extra elements are dropped.
- `unzip(tuples)` is the inverse of `zip`: it turns a list of tuples back into one array per position.

```typescript
function chunk<T>(arr: T[], size: number): T[][];

function zip<A, B>(a: A[], b: B[]): [A, B][];
function zip<A, B, C>(a: A[], b: B[], c: C[]): [A, B, C][];
function zip(...arrays: unknown[][]): unknown[][];

function unzip<A, B>(tuples: [A, B][]): [A[], B[]];
function unzip<A, B, C>(tuples: [A, B, C][]): [A[], B[], C[]];
function unzip(tuples: unknown[][]): unknown[][];
```

---

## Examples

### Example 1

```typescript
chunk([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]
chunk([1, 2, 3], 5); // [[1, 2, 3]]
chunk([], 3); // []
chunk([1], 0); // throws RangeError
```

### Example 2

```typescript
zip(['a', 'b', 'c'], [1, 2, 3]); // [['a', 1], ['b', 2], ['c', 3]]
zip([1, 2, 3], ['x']); // [[1, 'x']]
zip(); // []
```

### Example 3

```typescript
unzip([
  ['a', 1],
  ['b', 2],
]); // [['a', 'b'], [1, 2]]
unzip(zip(['a', 'b'], [1, 2])); // [['a', 'b'], [1, 2]]
```

---

## Constraints

- Never mutate the inputs; every returned array is new
- `chunk` throws `RangeError` for `size < 1`, `NaN`, or a non-integer
- `zip` with any empty array returns `[]`
- `unzip([])` returns `[]`

---

## Approach Hints

<details><summary>Hint 1</summary>
For `chunk`, step `i` by `size` and `slice(i, i + size)`. `slice` already clamps the end, so the short last group is free.
</details>

<details><summary>Hint 2</summary>
For `zip`, compute `Math.min(...arrays.map((a) => a.length))` first. Guard the no-arrays case: `Math.min()` of nothing is `Infinity`.
</details>

<details><summary>Hint 3</summary>
`unzip(tuples)` is `zip(...tuples)`: transposing a matrix twice gives the original.
</details>

---

## Related Problems

- Implement Array.prototype.flat
- Implement GroupBy
