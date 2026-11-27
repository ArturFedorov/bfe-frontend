# 001. Valid Palindrome II (LeetCode 680)

**Difficulty:** Easy
**Topics:** Two Pointers, String, Greedy

---

## Description

Given a string `s`, return `true` if `s` can be turned into a palindrome by
deleting **at most one** character from it, and `false` otherwise. A string that
is already a palindrome needs no deletion and is therefore valid.

## Examples

```ts
validPalindrome('aba'); // true  (already a palindrome)
validPalindrome('abca'); // true  (delete 'b' or 'c')
validPalindrome('abc'); // false (needs two deletions)
```

## Constraints

- `1 <= s.length <= 10^5`
- `s` consists of lowercase English letters.

## Target

O(n) time, O(1) extra space. Two pointers move inward; on the first mismatch,
try skipping either the left or the right character and check the remainder
once. The large-input test (~10^5 chars) will time out a brute force that
tries every deletion and re-checks the whole string (O(n^2)).

## Interviewer follow-up

- Allow deleting at most **k** characters (LC 1216 Valid Palindrome III) — how does the approach change? (DP on longest palindromic subsequence, O(n^2).)
- Why can't you just greedily skip one side on a mismatch? Show an input where picking the wrong side gives the wrong answer.
- Return the index of the character to delete (or -1) instead of a boolean.
