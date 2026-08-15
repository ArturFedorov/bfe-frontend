# 065. Sliding Max Latency

**Difficulty:** Hard
**Topics:** Monotonic Deque, Sliding Window, Streaming Metrics

---

## Description

Your latency dashboard shows the worst request in the recent window, updated
live: as each request's latency arrives, the widget must display the maximum
over the last `N` values (or over everything so far, while fewer than `N` have
arrived). Requests stream in forever, so recomputing the max by scanning the
window on every arrival is too slow. Build `SlidingMaxLatency` with a
`record(latency)` method that ingests one value and returns the current window
maximum — the classic monotonic-deque structure where values that can never be
a future maximum are discarded the moment a larger value arrives.

## Examples

```ts
const w = new SlidingMaxLatency(3);
w.record(120); // 120
w.record(80);  // 120
w.record(95);  // 120
w.record(70);  // 95  — 120 fell out of the window
w.record(200); // 200
```

## Constraints

- The constructor throws an `Error` when `windowSize` is not a positive integer.
- `record(latency)` returns the max of the last `min(N, count)` values, including the one just recorded.
- Latencies are finite numbers; duplicates and zero are valid.
- Up to `100_000` records; memory stays O(N) no matter how many values ever arrive.

## Target

Amortized O(1) per record via a monotonic deque; the O(N)-scan-per-record approach will fail the large-input test.

## Interviewer follow-up

Each value is pushed once and popped at most once — but a JS array used as a deque makes `shift()` O(n). How do you get true O(1) at both ends?
