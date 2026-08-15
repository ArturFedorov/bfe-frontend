# 014. Bandwidth Burst

**Difficulty:** Medium
**Topics:** Sliding Window, Min-Length Window, Running Sum

---

## Description

A network analyzer inspects a sequence of file-transfer sizes (in MB) recorded on one link, in
order. Capacity planning wants to know how *bursty* the link is: the shortest run of consecutive
transfers whose combined size reaches the bandwidth cap counts as a burst — the shorter the run,
the sharper the spike. Given the transfer sizes and the cap, return the length of the shortest
contiguous run whose sum is greater than or equal to the cap, or `0` if no run ever reaches it.
All transfer sizes are positive, which is exactly what makes a grow/shrink window valid here.

## Examples

```ts
bandwidthBurst([2, 3, 1, 2, 4, 3], 7);  // 2  ([4, 3])
bandwidthBurst([1, 4, 4], 4);           // 1  (a single transfer meets the cap)
bandwidthBurst([1, 1, 1], 100);         // 0  (never reached)
```

## Constraints

- `transfers.length` is between `0` and `100_000`; every size is a positive integer.
- `cap` is a positive integer.
- Return `0` when no contiguous run reaches the cap (including an empty array).
- If the cap is only reached by the entire array, return `transfers.length`.

## Target

O(n) time, O(1) space — the right edge advances n times and the left edge advances at most n
times total; checking every (start, end) pair (O(n²)) will fail the large-input test.

## Interviewer follow-up

Transfers can now be *negative* (data reclaimed by deduplication) — why does the shrink step of
your window become unsound, and what approach handles mixed signs?
