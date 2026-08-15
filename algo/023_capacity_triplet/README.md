# 023. Capacity Triplet

**Difficulty:** Medium
**Topics:** Two Pointers, Sorting, Deduplication

---

## Description

A capacity planner has reserved a fixed block of compute, and provisioning wants to fill it with
**exactly three** VM instances so nothing is wasted. Given the catalog of available instance sizes
(unsorted, sizes may repeat) and the reserved capacity, return every distinct combination of three
sizes that sums exactly to the reservation. Two combinations are the same if they use the same
multiset of sizes — `[2, 4, 6]` and `[6, 2, 4]` are one result, and it must appear only once no
matter how many catalog entries share those sizes. Sort the catalog first, then pin one value and
converge two pointers over the rest, skipping duplicates as you go.

## Examples

```ts
capacityTriplet([8, 2, 6, 4, 2, 10], 16);
// [[2, 4, 10], [2, 6, 8]]

capacityTriplet([1, 1, 1, 1], 3); // [[1, 1, 1]] — one result despite four 1s

capacityTriplet([5, 5], 15); // [] — fewer than three instances
```

## Constraints

- `sizes.length` is between `0` and `5_000`; sizes are non-negative integers and may repeat.
- The input is unsorted; you may sort it (mutating the input is acceptable).
- Each catalog entry may be used at most once per triple, but equal sizes at different indices
  may appear together in one triple (e.g. `[1, 1, 1]` above).
- Each triple must be sorted ascending; the list of triples must be in ascending lexicographic
  order; no duplicate triples.
- Return `[]` when no triple matches, including inputs with fewer than three entries.

## Target

O(n²) time after an O(n log n) sort, O(1) extra space beyond the output.

## Interviewer follow-up

Provisioning now asks for **four** instances instead of three — how does your approach generalize,
what is the complexity, and at what k would you switch strategies entirely?
