# 013. Random Pick with Weight (LeetCode 528)

**Difficulty:** Medium
**Topics:** Array, Prefix Sum, Binary Search, Randomized

---

## Description

Implement a class `WeightedPicker` (LeetCode calls it `Solution`) that is built from an
array of positive integer weights `w`. Its `pickIndex()` returns a random index `i`
with probability `w[i] / sum(w)`.

Use `Math.random()` as the only source of randomness, consuming **exactly one call per
pick**. Map the random value `r ∈ [0, 1)` to a target `r * total` and return the
**first** index whose running (prefix) sum is **strictly greater** than that target.
Index `i` therefore owns the half-open slice `[prefix[i-1], prefix[i])` of
`[0, total)`. The tests mock `Math.random` and rely on this mapping.

## Examples

```ts
const picker = new WeightedPicker([1, 3]); // prefix [1, 4], total 4
// Math.random() -> 0.1  => target 0.4 => index 0
// Math.random() -> 0.25 => target 1.0 => index 1 (boundary belongs to the next index)
// Math.random() -> 0.9  => target 3.6 => index 1
picker.pickIndex();
```

## Constraints

- `1 <= w.length <= 10^4` (tests go up to 10^5)
- `1 <= w[i] <= 10^5`
- `pickIndex` is called up to `10^4` times (tests go up to 10^5).

## Target

O(n) construction, O(log n) per `pickIndex` via binary search over prefix sums, O(n)
space. The large test makes 10^5 picks on 10^5 weights — a linear scan per pick
(10^10 steps) will time out.

## Interviewer follow-up

- Support `updateWeight(i, w)` efficiently (Fenwick / segment tree: O(log n) both ways).
- Walker's alias method: O(1) per pick after O(n) setup — explain the trade-off.
- Sample `k` distinct indices without replacement, weighted.
