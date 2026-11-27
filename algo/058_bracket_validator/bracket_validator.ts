/**
 * Returns true when every `(`, `[`, `{` in the snippet is closed by the
 * matching bracket in the correct order. All other characters are ignored.
 * Never throws.
 */

const CLOSED_MAP: Record<string, string> = {
  '(': ')',
  '{': '}',
  '[': ']',
}

const CLOSED = new Set<string>([']', '}', ')']);

export function validateBrackets(snippet: string): boolean {
  const stack: string[] = [];

  for(const ch of snippet) {
    const closer = CLOSED_MAP[ch];

    if(closer !== undefined) {
      stack.push(closer);
    } else if (CLOSED.has(ch)) {
      if(stack.pop() !== ch) return false;
    }
  }

  return stack.length === 0;
}
