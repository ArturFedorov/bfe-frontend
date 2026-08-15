# 012. Longest Unique Run

**Difficulty:** Medium
**Topics:** Sliding Window, Hash Set, Variable Window

---

## Description

An access log lists the client id of every incoming request, in arrival order. An anomaly
dashboard wants to surface the longest streak of consecutive requests in which no client id
repeats — a long unique run suggests organic traffic, while short runs hint at a single client
hammering the API. Given the array of client ids, return the length of the longest contiguous run
containing no duplicate id. The log can be large, so restarting the scan from scratch after every
duplicate is too slow — grow and shrink one window as you go.

## Examples

```ts
longestUniqueRun(['a', 'b', 'c', 'a', 'b']);      // 3  ('a','b','c' or 'b','c','a' ...)
longestUniqueRun(['a', 'b', 'b', 'c', 'd']);      // 3  ('b','c','d')
longestUniqueRun(['x', 'x', 'x']);                // 1
```

## Constraints

- `clientIds.length` is between `0` and `100_000`; ids are arbitrary non-empty strings.
- An empty array returns `0`; a single element returns `1`.
- All-identical ids return `1`; all-unique ids return `clientIds.length`.
- Comparison is exact string equality (case-sensitive).

## Target

O(n) time with a hash set/map (each index enters and leaves the window at most once);
O(n²) restart-on-duplicate scanning will fail the large-input test.

## Interviewer follow-up

The log no longer fits in memory and streams in — you must report the current longest run so far
after every event. What state do you keep, and what happens to memory if client ids are unbounded
in variety?
