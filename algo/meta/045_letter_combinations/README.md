# 045. Letter Combinations of a Phone Number (LeetCode 17)

**Difficulty:** Medium
**Topics:** Backtracking, String, Hash Table

---

## Description

A classic phone keypad maps the digits `2`–`9` to letters:

| Digit | Letters | Digit | Letters |
| ----- | ------- | ----- | ------- |
| 2     | abc     | 6     | mno     |
| 3     | def     | 7     | pqrs    |
| 4     | ghi     | 8     | tuv     |
| 5     | jkl     | 9     | wxyz    |

Given a string `digits` containing only characters `2`–`9`, return every string
that could be typed by choosing one letter for each digit, in digit order. The
results may be returned in any order. If `digits` is empty, return an empty
array (not `['']`).

## Examples

```ts
letterCombinations('23');
// ['ad', 'ae', 'af', 'bd', 'be', 'bf', 'cd', 'ce', 'cf']  (any order)

letterCombinations('');
// []

letterCombinations('2');
// ['a', 'b', 'c']
```

## Constraints

- `0 <= digits.length <= 4`
- `digits[i]` is a digit in the range `'2'`–`'9'`.

## Target

O(4^n · n) time and output space — up to `4^n` strings of length `n`, which is
optimal. Backtracking (build a prefix, recurse on the next digit) or iterative
BFS-style expansion of a result list both meet it.

## Interviewer follow-up

- Return only combinations that are real words given a dictionary — how would a Trie prune the search early?
- Do it iteratively (queue / expanding array) instead of recursively.
- How would you stream results lazily (generator) when `digits` is long and the output can't fit in memory?
