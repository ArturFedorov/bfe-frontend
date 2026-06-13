# N22. Find-and-Replace Codemod

**Difficulty:** Medium
**Topics:** Regex, AST, Codemods

---

## Description

Rename a whole identifier across a source string without clobbering substrings
inside larger identifiers. Build it with regex first, then discuss why an AST is
more robust.

## Examples

```ts
rename('foo(); foobar;', 'foo', 'bar');
// 'bar(); foobar;'
```

## Constraints

- Match identifier boundaries, not arbitrary substrings.
- Discuss trade-offs: regex word boundaries vs. tokenizer/AST awareness of strings & comments.
