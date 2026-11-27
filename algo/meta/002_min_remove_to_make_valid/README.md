# 002. Minimum Remove to Make Valid Parentheses (LeetCode 1249)

**Difficulty:** Medium
**Topics:** String, Stack

---

## Description

You are given a string `s` made of `'('`, `')'` and lowercase English letters.
Remove the **minimum number** of parentheses (from any positions) so that the
resulting string is a valid parentheses string, and return any such result.

A string is valid when it is empty, contains only letters, or every `')'`
closes an earlier unmatched `'('` and no `'('` is left unmatched. Letters are
never removed, and the relative order of the kept characters must not change.

## Examples

```ts
minRemoveToMakeValid('lee(t(c)o)de)'); // 'lee(t(c)o)de'  (other answers like 'lee(t(co)de)' also accepted)
minRemoveToMakeValid('a)b(c)d'); // 'ab(c)d'
minRemoveToMakeValid('))(('); // ''
```

## Constraints

- `1 <= s.length <= 10^5`
- `s[i]` is `'('`, `')'`, or a lowercase English letter.
- Several answers may exist; any valid string obtained with the minimum number of removals is accepted.

## Target

O(n) time, O(n) space. One pass tracks unmatched `'('` indices (stack or
counter) and drops unmatched `')'`; a second pass (or the leftover stack) drops
unmatched `'('`. The large-input test (~10^5 chars) will time out solutions that
repeatedly rebuild the string or rescan it per removal (O(n^2)).

## Interviewer follow-up

- Solve it with **O(1) extra space** besides the output (two passes with a counter: left-to-right drops extra `')'`, right-to-left drops extra `'('`).
- Return only the **count** of removals (that's LC 921-like) — or return **all** valid strings with minimum removals (LC 301 Remove Invalid Parentheses, BFS/backtracking).
- Support multiple bracket types `()[]{}`.
