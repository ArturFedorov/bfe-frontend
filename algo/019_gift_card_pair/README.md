# 019. Gift Card Pair

**Difficulty:** Easy
**Topics:** Two Pointers, Sorted Arrays, Search

---

## Description

A store catalog lists item prices sorted in ascending order. A customer wants to spend a gift card
**exactly** by buying two different items whose prices sum to the card balance. Find the indices of
such a pair, or report that none exists. Because the catalog is sorted, you can converge two
pointers from both ends instead of hashing every price — no extra memory, one pass. Be ready to
explain why sortedness makes the pointer moves safe.

## Examples

```ts
giftCardPair([5, 10, 25, 40, 60], 50); // [1, 3] — 10 + 40 = 50
giftCardPair([5, 10, 25, 40, 60], 11); // null — no pair spends the card exactly
giftCardPair([20, 20], 40);            // [0, 1] — two items may share a price
```

## Examples (edge)

```ts
giftCardPair([], 10);   // null
giftCardPair([10], 10); // null — a pair needs two distinct items
```

## Constraints

- `prices.length` is between `0` and `100_000`; prices are non-negative integers sorted ascending.
- Prices may repeat; the two items must be at different indices.
- Return a pair `[i, j]` with `i < j` such that `prices[i] + prices[j] === balance`; any valid
  pair is accepted.
- Return `null` when no pair exists (including empty and single-item catalogs).
- Do not use a map or set — the sorted order is the whole point.

## Target

O(n) time, O(1) extra space.

## Interviewer follow-up

The catalog now arrives unsorted — compare sorting first (O(n log n), O(1) space) against a
one-pass hashmap (O(n) time, O(n) space). Which would you ship, and what changes if the catalog no
longer fits in memory?
