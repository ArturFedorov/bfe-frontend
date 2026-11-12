# 084. Audience Set Ops

**Difficulty:** Easy
**Topics:** Two Pointers, Sorted Merges, Set Algebra, Performance Budgets

---

## Description

A marketing-automation platform stores every **audience** as a sorted,
de-duplicated array of contact ids (strings). Campaign targeting is set
algebra over audiences: "newsletter subscribers **plus** webinar attendees,
**minus** anyone who already bought, **and** is in all three regional
lists". Audiences run to hundreds of thousands of ids, and a send schedule
may evaluate dozens of these expressions per minute — so the operations must
be linear and must not allocate a hash set per call.

Implement the operations as **two-pointer merges** over the sorted inputs.
Every function returns a **new** sorted, de-duplicated array and never
mutates its arguments.

- `union(a, b)` — every id in `a` or `b`.
- `intersect(a, b)` — ids in both.
- `difference(a, b)` — ids in `a` that are not in `b`.
- `intersectMany(lists)` — ids present in **every** list. Order the lists
  smallest-first so the running result only shrinks, and exit early as soon
  as the running result is empty. `intersectMany([])` is `[]`;
  `intersectMany([x])` is a copy of `x`.
- `isSorted(ids)` — `true` when `ids` is strictly increasing in the default
  JavaScript string order (`<` on strings, the same order `Array.prototype.sort()`
  uses with no comparator). Strictly increasing means duplicates make it
  `false`. Every other export must call it and throw a `TypeError` when any
  input is not sorted — a silently wrong merge on unsorted data is the
  worst failure mode here.

Do **not** reach for `Set`, `includes`, or `indexOf`: the whole point is
that two sorted sequences can be merged in a single pass. The suite reads
this file's source and fails if those appear.

## Examples

```ts
const subscribers = ['c001', 'c002', 'c005', 'c009'];
const attendees   = ['c002', 'c003', 'c009', 'c010'];
const buyers      = ['c005', 'c010'];

union(subscribers, attendees);        // ['c001', 'c002', 'c003', 'c005', 'c009', 'c010']
intersect(subscribers, attendees);    // ['c002', 'c009']
difference(subscribers, buyers);      // ['c001', 'c002', 'c009']

intersectMany([subscribers, attendees, ['c009', 'c011']]); // ['c009']
intersectMany([subscribers, [], attendees]);               // []  (early exit)

isSorted(['a', 'b', 'b']);            // false — not strictly increasing
union(['b', 'a'], []);                // throws TypeError
```

## Constraints

- `0 <= a.length, b.length <= 200_000`; ids are non-empty strings.
- Inputs are sorted ascending and unique; unsorted or duplicated input must
  throw `TypeError` (validate in O(n) before merging).
- Outputs are new arrays — never return an input array by reference, even
  when the other side is empty.
- No `Set`, no `Array.prototype.includes` / `indexOf` anywhere in the module.
- Two 200k-element inputs must go through `union`, `intersect`, and
  `difference` well under a second **combined**; `intersectMany` over ten
  200k lists must also finish well under a second.

## Target

O(n + m) time and O(n + m) output space for each binary operation.
`intersectMany` is O(total ids). The shape to reach for:

```
i = j = 0
while i < a.length and j < b.length:
  if a[i] === b[j]:  (both)     i++, j++
  elif a[i] < b[j]:  (only a)   i++
  else:              (only b)   j++
drain the remaining tail(s) when the operation wants them
```

Senior signal: knowing which tails to drain for each operation (`union`
drains both, `difference` drains only `a`, `intersect` drains neither), and
explaining why `intersectMany` sorts by length first.

## Interviewer follow-up

Ids now arrive as 64-bit numeric strings of varying length (`'7'`, `'42'`,
`'1003'`). Default string order no longer matches numeric order. What breaks,
and what would you change — the comparator, the storage format, or the
contract? How would you make the comparator pluggable without paying a
function call per element on the hot path?
