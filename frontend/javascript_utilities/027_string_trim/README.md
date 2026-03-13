# 27. Implement String.prototype.trim

**Difficulty:** Easy

**Topics:** JavaScript Utilities, Strings, Regular Expressions

---

## Description

Implement your own version of `String.prototype.trim()`. The function should remove leading and trailing whitespace characters from a string.

Whitespace characters include spaces, tabs (`\t`), newlines (`\n`), carriage returns (`\r`), and other Unicode whitespace.

```typescript
function myTrim(str: string): string
```

---

## Examples

### Example 1
```typescript
myTrim("  hello  "); // "hello"
```

### Example 2
```typescript
myTrim("\t\n  hello world \r\n"); // "hello world"
```

### Example 3
```typescript
myTrim("no whitespace"); // "no whitespace"
```

---

## Constraints

- Do not use the built-in `String.prototype.trim()`, `trimStart()`, or `trimEnd()`
- Should handle all common whitespace characters: space, `\t`, `\n`, `\r`, `\f`, `\v`
- Should return the original string if there is no leading or trailing whitespace

---

## Approach Hints

<details><summary>Hint 1</summary>
You can use a regular expression to match leading and trailing whitespace.
</details>

<details><summary>Hint 2</summary>
The regex character class `\s` matches any whitespace character.
</details>

<details><summary>Hint 3</summary>
Alternatively, find the first and last non-whitespace character indices and use `substring`.
</details>
