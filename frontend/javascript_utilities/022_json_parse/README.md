# 22. Implement JSON.parse

**Difficulty:** Hard

**Topics:** JavaScript Utilities, Parsing, Recursive Descent

---

## Description

Implement a `jsonParse` function that parses a JSON string and returns the corresponding JavaScript value. Use a recursive descent parser approach.

```typescript
function jsonParse(text: string): any
```

---

## Examples

### Example 1
```typescript
jsonParse('{"a":1,"b":[2,3]}'); // { a: 1, b: [2, 3] }
```

### Example 2
```typescript
jsonParse('"hello\\nworld"'); // "hello\nworld"
```

---

## Constraints

- Must handle strings, numbers, booleans, null, arrays, and objects
- Must handle whitespace between tokens
- Must handle escape sequences in strings (`\\`, `\"`, `\n`, `\t`, etc.)
- Must throw an error on invalid JSON input
- Do NOT use `eval`, `new Function`, or `JSON.parse`

---

## Approach Hints

<details><summary>Hint 1</summary>
Maintain an index pointer that advances through the string character by character.
</details>

<details><summary>Hint 2</summary>
Write separate parsing functions for each JSON type: `parseString`, `parseNumber`, `parseArray`, `parseObject`, etc.
</details>

<details><summary>Hint 3</summary>
Skip whitespace between tokens using a helper function.
</details>

---

## Related Problems

- Implement JSON.stringify
- Implement a Calculator Parser
