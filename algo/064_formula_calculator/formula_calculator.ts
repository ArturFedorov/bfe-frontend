/**
 * Evaluates a spreadsheet formula string supporting:
 * - `+`, `-`, `*`, `/` with standard precedence and left associativity
 * - parentheses to any depth
 * - unary minus before a number or parenthesized group
 * - integer and decimal literals (digits on both sides of the point)
 * - arbitrary whitespace between tokens
 *
 * Throws an Error on malformed input and on division by zero.
 * No eval / new Function.
 */
export function evaluateFormula(formula: string): number {
  // TODO: implement
  throw new Error('Not implemented');
}
