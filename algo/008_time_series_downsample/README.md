# 008. Time Series Downsample

**Difficulty:** Medium
**Topics:** Arrays, Bucketing, Aggregation, Numeric Precision

---

## Description

A monitoring dashboard cannot render a million raw metric samples — the chart
is only a few hundred pixels wide. Implement `downsample(samples, bucketCount)`:
given samples sorted by timestamp ascending, split the time range
`[firstTimestamp, lastTimestamp]` into `bucketCount` equal-width buckets and
aggregate each bucket into `{ startTime, endTime, min, max, avg, count }`.
A sample belongs to bucket `floor((timestamp - firstTimestamp) / width)`;
the very last timestamp lands exactly on the far edge and is clamped into the
final bucket. Return only non-empty buckets, in time order — empty buckets are
omitted so the chart can simply connect the dots.

## Examples

```ts
downsample(
  [
    { timestamp: 0, value: 10 },
    { timestamp: 5, value: 30 },
    { timestamp: 10, value: 20 },
    { timestamp: 95, value: 50 },
    { timestamp: 100, value: 40 },
  ],
  10,
);
// [
//   { startTime: 0,  endTime: 10,  min: 10, max: 30, avg: 20, count: 2 },
//   { startTime: 10, endTime: 20,  min: 20, max: 20, avg: 20, count: 1 },
//   { startTime: 90, endTime: 100, min: 40, max: 50, avg: 45, count: 2 },
// ]

downsample([{ timestamp: 42, value: 7 }], 5);
// [{ startTime: 42, endTime: 42, min: 7, max: 7, avg: 7, count: 1 }]

downsample([], 4); // []
```

## Constraints

- `bucketCount` must be a positive integer; throw `RangeError` otherwise.
- `samples` is sorted by `timestamp` ascending (guaranteed); timestamps may repeat.
- Empty input returns `[]`.
- When all samples share one timestamp (zero-width range), everything goes into a single bucket `[t, t]`.
- `avg` is the arithmetic mean of the bucket's values; values may be negative.
- Bucket `i` spans `startTime = t0 + i * width`, `endTime = t0 + (i + 1) * width` where `width = (tLast - t0) / bucketCount`.
- Returned buckets are ordered by `startTime` ascending; empty buckets are omitted.

## Target

O(n) single pass over the samples; an O(n × bucketCount) per-bucket rescan
will fail the large-input test (100k samples, 10k buckets).

## Interviewer follow-up

Samples now arrive as a live stream and the chart must stay current — how do
you update buckets incrementally, and why does this get much harder if the
dashboard also wants p50/p95 per bucket instead of min/max/avg?
