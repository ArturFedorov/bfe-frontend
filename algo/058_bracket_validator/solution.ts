/**
 * Bracket Validator — reference solution.
 *
 * Single pass with a stack of *expected closers*: on an opener push the
 * bracket that must close it; on a closer, it must equal the stack top (a
 * mismatch or an empty stack means the snippet is unbalanced). Every other
 * character is skipped. The snippet is balanced iff the stack is empty at
 * the end. Three counters cannot work because they lose the *order* in which
 * openers appeared — `[(])` balances every counter yet is invalid.
 *
 * Time:  O(n).
 * Space: O(n) worst case (all openers, e.g. deep nesting).
 */

const CLOSER_FOR: Record<string, string> = {
  '(': ')',
  '[': ']',
  '{': '}',
};

const CLOSERS = new Set([')', ']', '}']);

/**
 * Returns true when every `(`, `[`, `{` in the snippet is closed by the
 * matching bracket in the correct order. All other characters are ignored.
 * Never throws.
 */
export function validateBrackets(snippet: string): boolean {
  const expected: string[] = [];

  for (const ch of snippet) {
    const closer = CLOSER_FOR[ch];
    if (closer !== undefined) {
      expected.push(closer);
    } else if (CLOSERS.has(ch)) {
      // A closer must match the most recent unclosed opener.
      if (expected.pop() !== ch) return false;
    }
    // any other character: ignored
  }

  return expected.length === 0;
}
