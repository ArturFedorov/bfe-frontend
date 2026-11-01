# N1. Semver Parser

**Difficulty:** Easy
**Topics:** Parsing, Regex, Semver

---

## Description

Parse a semver string such as `1.2.3` or `1.2.3-beta.1` into
`{ major, minor, patch, prerelease }`.

## Examples

```ts
parseVersion('1.2.3');        // { major: 1, minor: 2, patch: 3, prerelease: null }
parseVersion('1.2.3-beta.1'); // { ..., prerelease: 'beta.1' }
```

## Constraints

- `major.minor.patch` are non-negative integers.
- `prerelease` is everything after the first `-`, or `null` if absent.
- Throw on malformed input.
