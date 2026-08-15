# 011. Request Rate Alarm

**Difficulty:** Easy
**Topics:** Sliding Window, Queues, Time Windows, Rate Limiting

---

## Description

An API gateway feeds an alarm system with request timestamps in milliseconds, in non-decreasing
order. After every request the alarm must know the current request rate: how many requests
(including the one just recorded) arrived within the last 60 seconds. Concretely, `record(t)`
returns the number of recorded requests whose timestamp `ts` satisfies `t - 60_000 < ts <= t` — a
request exactly 60 seconds old has already fallen out of the window. This is the core bookkeeping
of a sliding-window rate limiter, and it must stay fast and memory-bounded even after millions of
requests: keep only what is still inside the window.

## Examples

```ts
const alarm = new RequestRateAlarm();
alarm.record(0);       // 1
alarm.record(1);       // 2
alarm.record(60_000);  // 2  (the request at t=0 is exactly 60s old — out of the window)
alarm.record(60_001);  // 2  (window (1, 60_001] holds 60_000 and 60_001)
```

## Constraints

- Timestamps are non-negative integers in milliseconds and arrive in non-decreasing order;
  `record` throws an `Error` if a timestamp is smaller than the previous one.
- Duplicate timestamps are allowed and each counts separately.
- The window is `(t - 60_000, t]` — half-open on the old side, inclusive of `t` itself.
- The stream can exceed `100_000` requests; memory must be proportional to the window contents,
  not to total history.

## Target

Amortized O(1) per `record` (each timestamp is enqueued and dequeued once); re-scanning or
re-filtering the full history on every call (O(n) per call, O(n²) total) will fail the
large-input test.

## Interviewer follow-up

The gateway is now a fleet of 50 instances, each seeing a slice of the traffic — how do you get a
fleet-wide "requests in the last 60s" number, and what accuracy would you trade for cheap
aggregation?
