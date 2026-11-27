# 003. Minimum Add to Make Parentheses Valid (LeetCode 921)

**Difficulty:** Medium
**Topics:** String, Stack, Greedy

---

## Description

You are given a string `s` consisting only of `'('` and `')'`. In one move you
may insert a single parenthesis at any position. Return the **minimum number of
insertions** required to make `s` a valid parentheses string (every `')'`
closes an earlier unmatched `'('`, and no `'('` is left open).

## Examples

```ts
minAddToMakeValid('())'); // 1  (insert '(' at the front)
minAddToMakeValid('((('); // 3  (close all three)
minAddToMakeValid('()'); // 0
minAddToMakeValid('()))(('); // 4
```

## Constraints

- `1 <= s.length <= 10^5` (the tests also pass an empty string, expecting `0`)
- `s[i]` is `'('` or `')'`.

## Target

O(n) time, O(1) space — track the current open balance and count unmatched
closers; the answer is `unmatchedClosers + openBalance`. The large-input test
(~10^5 chars) will time out an approach that repeatedly strips `"()"` pairs
from the string (O(n^2)).

## Interviewer follow-up

- Return the **fixed string** itself, not just the count (insert where needed) — or the min **removals** variant (LC 1249).
- Each `'('` must be closed by `'))'` (two closers) — LC 1541 Minimum Insertions to Balance a Parentheses String.
- Do it with multiple bracket types; why does a counter no longer suffice?
