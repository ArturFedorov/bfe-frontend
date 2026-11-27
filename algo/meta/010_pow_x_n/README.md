# 010. Pow(x, n) (LeetCode 50)

**Difficulty:** Medium
**Topics:** Math, Recursion, Fast Exponentiation

---

## Description

Compute `x` raised to the integer power `n` without using `Math.pow` or the `**`
operator. `n` may be zero or negative (`x^-n = 1 / x^n`).

## Examples

```ts
myPow(2, 10);  // 1024
myPow(2.1, 3); // 9.261
myPow(2, -2);  // 0.25
```

## Constraints

- `-100 < x < 100`
- `-2^31 <= n <= 2^31 - 1`
- `n` is an integer; either `x` is non-zero or `n > 0`.
- The result fits comfortably in a double (or underflows to 0).
- Do not use `Math.pow` or `**`.

## Target

O(log n) time, O(1) space (iterative) or O(log n) stack (recursive). The tests use
`|n|` up to 2^31, so a linear loop of multiplications will time out.

## Interviewer follow-up

- Write it iteratively using the binary representation of `n`.
- What breaks for `n = -2^31` in languages with 32-bit ints (negating overflows)?
- Extend to modular exponentiation `x^n mod m` for big integers.
