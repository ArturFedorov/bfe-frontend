# 060. Path Normalizer

**Difficulty:** Medium
**Topics:** Stack, String Parsing, File Systems

---

## Description

Your build tool receives file paths assembled from user config, environment
variables, and string concatenation — so they arrive messy: `/a/./b/../c//d`.
Before hitting the file system every path must be reduced to its canonical
absolute form, exactly like `path.posix.normalize` on an absolute path. Walk the
segments with a stack: real names push, `.` is dropped, `..` pops the most
recent name. Implement it from scratch — do not import `path`.

Normalization rules (each one is tested):

- **`.` segment** — refers to the current directory; remove it: `/a/./b` → `/a/b`.
- **`..` segment** — pops the previous real segment: `/a/b/../c` → `/a/c`.
- **`..` past root** — cannot go above root; stays at root: `/../../a` → `/a`.
- **Duplicate slashes** — collapse to one: `/a//b///c` → `/a/b/c`.
- **Trailing slash** — removed from the result (`/a/b/` → `/a/b`) except when the
  result is the root itself, which is exactly `/`.

## Examples

```ts
normalizePath('/a/./b/../c//d'); // '/a/c/d'
normalizePath('/../');           // '/'
normalizePath('/home//user/');   // '/home/user'
```

## Constraints

- Input length up to `100_000` characters.
- Input must be an absolute path: throws an `Error` when it is empty or does not
  start with `/`.
- Segments may contain any non-`/` characters, including names like `...` or
  `..hidden`, which are ordinary names — only the exact segments `.` and `..`
  are special.
- The result always starts with `/` and has no trailing slash unless it is `/`.

## Target

O(n) time, single left-to-right pass with a segment stack; no regex backtracking, no `path` module.

## Interviewer follow-up

How would the rules change for relative paths (no leading `/`), where leading `..` segments must be preserved instead of dropped?
