# 005. Filename Grouper

**Difficulty:** Medium
**Topics:** Hash Maps, Strings, Canonicalization

---

## Description

An asset pipeline receives files exported from different tools, and every tool
has its own naming convention: `myFile-v2`, `my_file_v2`, `My File V2` are all
the same asset. Implement `groupFilenames(names)`: group names that are equal
once you ignore letter case and the separator characters `-`, `_`, and space.
The core design decision is the canonical map key — two names belong together
exactly when their canonical forms match (e.g. both `myFile-v2` and
`my_file_v2` canonicalize to `myfilev2`). Return the groups as arrays of the
original, unmodified names.

## Examples

```ts
groupFilenames(['myFile-v2', 'report', 'my_file_v2', 'Report']);
// [['myFile-v2', 'my_file_v2'], ['report', 'Report']]

groupFilenames(['a-b', 'ab', 'a b', 'c']);
// [['a-b', 'ab', 'a b'], ['c']]

groupFilenames([]);
// []
```

## Constraints

- Up to `100_000` names.
- Separators to ignore: `-`, `_`, and the space character (dots and other punctuation are significant).
- Groups appear in order of each group's first occurrence in the input; names inside a group keep their input order.
- Singleton groups are included.
- Exact duplicate names are kept as separate entries in the same group.
- Names may be empty or consist only of separators — those all canonicalize to `''` and group together.

## Target

O(total characters) with a canonical-key map; O(n²) pairwise comparison will
fail the 100k large-input test.

## Interviewer follow-up

Filenames can be Unicode — accented characters, Turkish `İ`/`ı`, full-width
letters. Where does `toLowerCase()` stop being a correct canonicalizer, and
what would you use instead?
