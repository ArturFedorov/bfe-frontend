# 047. Remove Invalid Parentheses (LeetCode 301)

**Difficulty:** Hard
**Topics:** Backtracking, BFS, String

---

## Description

Given a string `s` made of parentheses `(` `)` and lowercase letters, delete
the **minimum** number of parentheses so that the remaining string is valid
(every `)` closes an earlier unmatched `(`, and no `(` is left unmatched).
Letters are never removed and do not affect validity.

Return **every distinct** valid string reachable with that minimum number of
removals, in any order. If even removing all parentheses is necessary, the
answer still contains at least one string (possibly `''`).

## Examples

```ts
removeInvalidParentheses('()())()');
// ['(())()', '()()()']  (any order)

removeInvalidParentheses('(a)())()');
// ['(a())()', '(a)()()']  (any order)

removeInvalidParentheses(')(');
// ['']
```

## Constraints

- `1 <= s.length <= 25`
- `s` consists of lowercase English letters and the characters `(` and `)`.
- There are at most `20` parentheses in `s`.

## Target

First count how many `(` and how many `)` must go (one linear scan), then
backtrack, removing only that many of each, pruning on a negative balance and
skipping consecutive identical characters to avoid duplicate work. Worst case
is exponential in the number of parentheses (O(2^p · n)), but pruning keeps it
fast in practice. A level-by-level BFS (remove one char per level, stop at the
first level with a valid string) is also accepted.

## Interviewer follow-up

- **The common Meta variant — LC 1249 Minimum Remove to Make Valid Parentheses:** return just **one** valid string with the minimum removals, in O(n) with a stack or two passes. Be ready to switch between the two.
- Why does BFS guarantee minimum removals, and what's the cost of the `visited` set?
- How does skipping `s[i] === s[i - 1]` at the same recursion level avoid duplicate results?
