# 005. Custom Sort String (LeetCode 791)

**Difficulty:** Medium
**Topics:** Hash Table, String, Counting Sort

---

## Description

You are given two strings `order` and `s`. Every character in `order` is
unique and describes a custom ranking: if `x` appears before `y` in `order`,
then every `x` must appear before every `y` in the result.

Return any permutation of `s` that respects this ranking. Characters of `s`
that do not appear in `order` are unconstrained and may be placed anywhere.

## Examples

```ts
customSortString('cba', 'abcd'); // 'cbad'  ('dcba', 'cdba', 'cbda' are also accepted)
customSortString('bcafg', 'abcd'); // 'bcad' (or any placement of 'd')
customSortString('kqep', 'pekeq'); // 'kqeep'
```

## Constraints

- `1 <= order.length <= 26`, `1 <= s.length <= 10^5` (tests go to ~10^5)
- `order` and `s` consist of lowercase English letters; all characters of `order` are unique.
- Several answers may exist — tests check that the output is a permutation of `s` whose ordered characters follow `order`.

## Target

O(n + |order|) time, O(1) extra space (a 26-slot count) — counting sort:
count `s`, emit characters in `order` sequence, then append the rest.
A comparator sort (O(n log n)) also passes; the large test checks you don't do
something quadratic like repeated `indexOf`/string splicing.

## Interviewer follow-up

- Why is counting sort better than `s.split('').sort((a, b) => rank[a] - rank[b])` here, and when wouldn't it be?
- Verify instead of produce: given `order` and a list of words, are the words sorted (LC 953 Verifying an Alien Dictionary)?
- Derive `order` from a sorted word list (LC 269 Alien Dictionary — topological sort).
