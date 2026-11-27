# 007. Add Strings & Add Binary (LeetCode 415 + 67)

**Difficulty:** Easy
**Topics:** Math, String, Simulation

---

## Description

Implement grade-school addition on numbers given as strings.

1. `addStrings(a, b)` — `a` and `b` are non-negative integers written in
   **base 10**. Return their sum as a base-10 string.
2. `addBinary(a, b)` — `a` and `b` are non-negative integers written in
   **base 2**. Return their sum as a base-2 string.

The inputs can be far longer than any built-in number type can hold, so you
must add digit by digit with a carry. **Do not** convert the whole input to a
number, and do not use `BigInt` (or `parseInt` on the full string) — the
interviewer will ask you to remove it.

## Examples

```ts
addStrings('11', '123'); // '134'
addStrings('456', '77'); // '533'
addStrings('0', '0'); // '0'

addBinary('11', '1'); // '100'
addBinary('1010', '1011'); // '10101'
```

## Constraints

- `1 <= a.length, b.length <= 10^4` (tests go to ~10^5 digits)
- `a` and `b` contain only digits of their base (`0-9` / `0-1`).
- Neither input has leading zeros except the number `0` itself; the result must not have leading zeros either.

## Target

O(max(n, m)) time, O(max(n, m)) space for the output — walk both strings from
the right with a carry, collect digits into an array, reverse and join once.
The large-input test (~10^5 digits) also catches answers that lose precision by
going through `Number`.

## Interviewer follow-up

- Generalise to `addInBase(a, b, base)` — one function for both problems.
- Multiply Strings (LC 43): O(n·m) with a positions array.
- Add with **decimal points** or **negative numbers** (subtract magnitudes, compare first) — a common Meta extension.
