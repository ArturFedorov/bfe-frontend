# 058. Bracket Validator

**Difficulty:** Very Easy
**Topics:** Stack, String Scanning, Linting

---

## Description

You are writing a lint rule for a config-file editor. Before saving, the linter
must verify that every `(`, `[`, and `{` in the snippet is closed by the matching
bracket in the correct order — `[(])` is a mistake even though the counts match.
All other characters (letters, digits, quotes, whitespace, other punctuation) are
irrelevant to this rule and must be ignored. Return `true` when the snippet is
balanced and `false` otherwise; malformed input is a normal outcome here, never
an exception.

## Examples

```ts
validateBrackets('server { port = (8080) }'); // true
validateBrackets('list[0] = { key: (a }');    // false — '(' closed by '}'
validateBrackets(')(');                       // false — closes before it opens
```

## Constraints

- Input is a string of length `0` to `100_000`.
- Only `()`, `[]`, `{}` participate; every other character is ignored.
- An empty string, or a string with no brackets at all, is balanced (`true`).
- A closing bracket with no matching opener, a mismatched pair, or a leftover
  unclosed opener all yield `false`.
- Never throws.

## Target

O(n) time, O(n) worst-case space — a single pass with one stack.

## Interviewer follow-up

Why can't this be solved with three counters (one per bracket type) instead of a stack?
