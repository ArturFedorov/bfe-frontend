# N12. Typosquatting Detector

**Difficulty:** Easy
**Topics:** Strings, Permutations, Security

---

## Description

Given a package name, generate likely typosquat variants an attacker might
publish: single-char deletions, adjacent swaps, and doubled characters.

## Examples

```ts
generateTyposquats('abc');
// ['aabc', 'abbc', 'abc'... excluding original, 'ac', 'acb', 'ab', 'bac', 'bc'] (sorted, deduped)
```

## Constraints

- Exclude the original name from the output.
- De-duplicate and sort the result.
