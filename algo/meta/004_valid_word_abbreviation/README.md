# 004. Valid Word Abbreviation (LeetCode 408)

**Difficulty:** Easy
**Topics:** Two Pointers, String

---

## Description

A word can be abbreviated by replacing any number of **non-adjacent, non-empty**
substrings with their lengths written in decimal. For example, `"substitution"`
can become `"s10n"`, `"sub4u4"`, `"12"`, or `"substitution"` itself. Lengths
must not have leading zeros (`"s010n"` is invalid), and a substring may not be
replaced by `"0"` (empty replacement). Two replaced substrings may not be
adjacent, which is why consecutive digits always form one number.

Given a `word` and an abbreviation `abbr`, return `true` if `abbr` is a valid
abbreviation of `word`.

## Examples

```ts
validWordAbbreviation('internationalization', 'i12iz4n'); // true
validWordAbbreviation('apple', 'a2e'); // false  ('a' + 2 chars + 'e' is 4 letters)
validWordAbbreviation('substitution', 's010n'); // false (leading zero)
validWordAbbreviation('word', '4'); // true
```

## Constraints

- `1 <= word.length <= 20`, `word` consists of lowercase English letters.
- `1 <= abbr.length <= 10`, `abbr` consists of lowercase letters and digits.
- All numbers in `abbr` fit in a 32-bit integer.

## Target

O(n + m) time, O(1) space — two pointers, parsing each digit run as a number
and skipping that many characters of `word`. Inputs are tiny, so there is no
large-input test; the interview is about getting every edge case right (leading
zeros, overshooting the end, trailing characters).

## Interviewer follow-up

- What if the number overshoots `word.length`? What if `abbr` ends while `word` still has characters left?
- Generate **all** abbreviations of a word (LC 320 Generalized Abbreviation) — backtracking, 2^n results.
- Allow abbreviations with wildcards or case-insensitive matching — how does the parser change?
