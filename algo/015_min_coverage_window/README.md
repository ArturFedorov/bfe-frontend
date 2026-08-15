# 015. Min Coverage Window

**Difficulty:** Hard
**Topics:** Sliding Window, Need/Have Counts, Min Window

---

## Description

A postmortem tool replays an event log — an array of event type strings in time order — and needs
to find the tightest slice of the timeline that tells the whole story: the shortest contiguous
window containing every required event type. Given the log and a list of required types, return
the inclusive index pair `[start, end]` of the shortest window that covers all requirements, or
`null` if no window does. If the required list names the same type more than once, the window must
contain at least that many occurrences of it. When several windows tie on length, return the one
that starts earliest. Maintain need/have counts as the window moves — re-checking coverage per
candidate window will not scale.

## Examples

```ts
minCoverageWindow(['a', 'b', 'x', 'a', 'c', 'b', 'c', 'a'], ['a', 'b', 'c']); // [3, 5]
minCoverageWindow(['a', 'a', 'b', 'a'], ['a', 'a', 'b']);                     // [0, 2]
minCoverageWindow(['a', 'b'], ['a', 'z']);                                    // null
```

## Constraints

- `events.length` is between `0` and `100_000`; types are non-empty, case-sensitive strings.
- `required` may contain duplicates: each duplicate demands one more occurrence in the window.
- Return `null` when coverage is impossible — and also when `required` is empty or `events` is
  empty (there is nothing meaningful to cover).
- Ties on window length resolve to the smallest `start`.
- The returned indices are inclusive: `events[start..end]` is the window.

## Target

O(n + r) time, O(r) space — right edge expands, left edge contracts, each index visited at most
twice; verifying coverage for every candidate window (O(n²)) will fail the large-input test.

## Interviewer follow-up

Required types now carry priorities, and the tool wants the shortest window covering all
*critical* types while maximizing how many *optional* types it happens to include — how does your
have/need bookkeeping change, and where does the greedy shrink step become a trade-off?
