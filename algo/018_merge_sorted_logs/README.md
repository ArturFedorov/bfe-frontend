# 018. Merge Sorted Logs

**Difficulty:** Easy
**Topics:** Two Pointers, Arrays, Merging

---

## Description

Two services write their own log files, and each file is already sorted by timestamp. For an
incident review you need a single combined timeline. Re-sorting the concatenation would waste the
work the services already did — instead, walk both files with parallel pointers and merge them in
one pass. When two entries share the same timestamp, entries from the **first** file must come
before entries from the second (the merge must be stable across inputs).

## Examples

```ts
const a = [{ timestamp: 1, message: 'a1' }, { timestamp: 5, message: 'a5' }];
const b = [{ timestamp: 3, message: 'b3' }, { timestamp: 5, message: 'b5' }];
mergeSortedLogs(a, b);
// [{ t:1 'a1' }, { t:3 'b3' }, { t:5 'a5' }, { t:5 'b5' }]

mergeSortedLogs([], b); // b's entries, unchanged order
mergeSortedLogs([], []); // []
```

## Constraints

- `a.length` and `b.length` are each between `0` and `100_000`.
- Both inputs are sorted by `timestamp` ascending; timestamps may repeat within and across files.
- On equal timestamps, entries from `a` precede entries from `b`; entries from the same file keep
  their original relative order.
- Return a new array; do not mutate the inputs.
- Do not use a sort call — the point is the linear merge.

## Target

O(n + m) time, O(n + m) space for the output.

## Interviewer follow-up

Now there are k log files instead of two — what changes in your approach, what data structure
takes over the "which pointer is smallest" decision, and what is the resulting complexity?
