# 10. Promisify

**Difficulty:** Medium
**Topics:** Promises, Callbacks, Node.js Patterns, Higher-Order Functions

---

## Description

Implement a `promisify` function that converts a callback-based function into one that returns a promise. The original function follows the Node.js convention where the last argument is a callback of the form `(error, result)`.

## Examples

```ts
function readFile(path: string, callback: (err: Error | null, data?: string) => void) {
  // callback-based API
}

const readFileAsync = promisify<string>(readFile);
const data = await readFileAsync("file.txt");
```

## Constraints

- The original function's last argument is always the callback
- The callback follows `(error, result)` convention
- If `error` is truthy, the promise should reject with it
- If `error` is null/undefined, the promise resolves with the result
- The original function's `this` context should be preserved

## Approach Hints

<details>
<summary>Hint 1</summary>
Return a new function that creates a promise. Inside the executor, call the original function with all provided arguments plus a callback appended at the end.
</details>

<details>
<summary>Hint 2</summary>
The callback checks if the first argument (error) is truthy. If so, reject. Otherwise, resolve with the second argument.
</details>

<details>
<summary>Hint 3</summary>
Use `fn.call(this, ...args, callback)` or `fn.apply(this, [...args, callback])` to preserve the `this` context from the caller.
</details>
