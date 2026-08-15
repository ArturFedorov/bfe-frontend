# 064. Formula Calculator

**Difficulty:** Hard
**Topics:** Stack, Expression Parsing, Recursive Descent / Shunting-Yard

---

## Description

Your spreadsheet product lets users type formulas like `2 + 3 * (4 - 1)` into a
cell, and `eval` is banned for obvious security reasons. Implement the evaluator
from scratch. It must support addition, subtraction, multiplication, and real
(floating-point) division with standard precedence and left associativity,
parentheses to any depth, unary minus (`-3`, `2 * -4`, `-(1 + 2)`), integer and
decimal literals like `2` and `3.25`, and arbitrary whitespace anywhere between
tokens. Bad input is a user typo, not a crash: the evaluator throws an `Error`
for malformed formulas and for division by zero.

## Examples

```ts
evaluateFormula('2+3*(4-1)');          // 11
evaluateFormula(' -2.5 * (4 + -6) ');  // 5
evaluateFormula('7 / 2 - 1');          // 2.5
```

## Constraints

- Formula length up to `100_000` characters; only digits, `.`, `+ - * /`, `(`, `)`, and whitespace are valid characters.
- `*` and `/` bind tighter than `+` and `-`; equal precedence evaluates left to right (`8 - 3 - 2` is `3`, `12 / 3 / 2` is `2`).
- Unary minus applies to the number or parenthesized group that follows it; doubled unary minus (`--3`) is malformed.
- Numbers are integers (`42`) or decimals with digits on both sides of the point (`3.25`); `.5`, `2.`, and `1.2.3` are malformed.
- Throws an `Error` on: empty/whitespace-only input, unbalanced or empty parentheses, dangling or doubled binary operators, adjacent numbers with no operator, invalid characters — and on any division by zero, including ones like `5 / (3 - 3)` that only appear at evaluation time.
- Never uses `eval`, `new Function`, or similar.

## Target

O(n) single tokenize + evaluate pass (two stacks or recursive descent); no regex-driven repeated rescanning.

## Interviewer follow-up

How would you extend your design to support exponentiation `^`, which is right-associative — what exactly changes in your precedence handling?
