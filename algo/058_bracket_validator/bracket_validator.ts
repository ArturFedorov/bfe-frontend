/**
 * Returns true when every `(`, `[`, `{` in the snippet is closed by the
 * matching bracket in the correct order. All other characters are ignored.
 * Never throws.
 */

const CLOSER_FOR: Record<string, string> = {
  '(': ')',
  '[': ']',
  '{': '}',
};

const CLOSES = new Set([')', '}', ']']);

export function validateBrackets(snippet: string): boolean {
  const expected = [];

  for (const ch of snippet) {
    const closer = CLOSER_FOR[ch];

    if (closer !== undefined) {
      expected.push(closer);
    } else if (CLOSES.has(ch)) {
      if (expected.pop() !== ch) return false;
    }
  }

  return expected.length === 0;
}
