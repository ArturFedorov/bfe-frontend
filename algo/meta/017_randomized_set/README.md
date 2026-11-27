# 017. Insert Delete GetRandom O(1) (LeetCode 380)

**Difficulty:** Medium
**Topics:** Design, Hash Table, Array, Randomized

---

## Description

Design a `RandomizedSet` class that stores a set of distinct integers and supports:

- `insert(val)` — adds `val` if it is not already present. Returns `true` if it was
  added, `false` if it was already in the set.
- `remove(val)` — deletes `val` if it is present. Returns `true` if it was removed,
  `false` if it was not in the set.
- `getRandom()` — returns one of the current elements, each with **equal
  probability**. It is only called when the set is non-empty.

Every operation must run in **average O(1)** time.

## Examples

```ts
const set = new RandomizedSet();
set.insert(1); // true
set.remove(2); // false (2 is not present)
set.insert(2); // true
set.getRandom(); // 1 or 2, each with probability 1/2
set.remove(1); // true
set.insert(2); // false (already present)
set.getRandom(); // 2 (the only element)
```

## Constraints

- `-2^31 <= val <= 2^31 - 1`
- Up to `2 * 10^5` calls in total.
- `getRandom` is only called when the set holds at least one element.
- Use `Math.random()` as the randomness source: the tests mock it and expect
  `getRandom()` to pick index `Math.floor(Math.random() * size)` of some internal
  ordering — so `n` distinct mocked values `0, 1/n, 2/n, …` must hit all `n` elements.

## Target

O(1) average per operation, O(n) space. A `Map<value, index>` plus a dense array;
remove by swapping the target with the last element and popping. The large-input
test (2·10^5 inserts, `getRandom` calls and removes, under 500 ms) will time out a solution that
uses `indexOf`/`splice` for removal or rebuilds an array from a `Set` in
`getRandom`.

## Interviewer follow-up

- Allow duplicates (LC 381 Insert Delete GetRandom O(1) – Duplicates allowed): what does the map store now, and how does swap-with-last change?
- Why can't you get O(1) `getRandom` from a `Set` / hash map alone?
- Weighted random pick (LC 528 Random Pick with Weight) — prefix sums + binary search.
