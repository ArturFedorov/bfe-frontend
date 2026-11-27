# 006. Group Shifted Strings (LeetCode 249)

**Difficulty:** Medium
**Topics:** Hash Table, String

---

## Description

Shifting a string means replacing every letter with the next letter of the
alphabet, wrapping `'z'` around to `'a'` — so `"abc"` shifts to `"bcd"` and
`"az"` shifts to `"ba"`. Repeated shifting produces a *shifting sequence*:
`"abc" -> "bcd" -> ... -> "xyz" -> "yza" -> ...`.

Given an array of strings, group together all strings that belong to the same
shifting sequence (i.e. one can be shifted some number of times to become the
other). Return the groups in any order; strings within a group may also be in
any order. Duplicate input strings are kept (each occurrence appears in the
output).

## Examples

```ts
groupStrings(['abc', 'bcd', 'acef', 'xyz', 'az', 'ba', 'a', 'z']);
// [['abc', 'bcd', 'xyz'], ['acef'], ['az', 'ba'], ['a', 'z']]  (any order)

groupStrings(['a']); // [['a']]
```

## Constraints

- `1 <= strings.length <= 10^4` (tests go to ~10^5)
- `1 <= strings[i].length <= 50`
- `strings[i]` consists of lowercase English letters.

## Target

O(total characters) time and space — normalise each string to a key (the
sequence of differences between consecutive letters mod 26, or the string
shifted so its first letter is `'a'`) and bucket by key in a hash map. The
large-input test (~10^5 strings) will time out a pairwise "can A shift into
B?" comparison (O(n^2)).

## Interviewer follow-up

- Why must the difference be taken **mod 26** (`'az'` vs `'ba'`)? What breaks if you key on raw differences?
- Generalise to Group Anagrams (LC 49): what's the analogous canonical key, and how do you make it O(k) rather than O(k log k)?
- Keys like `"1,25"` vs a joined string without separators — show a collision that a separator prevents.
