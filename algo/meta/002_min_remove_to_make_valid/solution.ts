/** Removes the minimum number of parentheses so that `s` becomes valid. */
export function minRemoveToMakeValid(s: string): string {
  // Pass 1 drops unmatched ')'; pass 2 (right-to-left) drops the rightmost unmatched '('.
  const kept: string[] = [];
  let open = 0;
  for (const ch of s) {
    if (ch === ')') {
      if (open === 0) continue;
      open--;
    } else if (ch === '(') {
      open++;
    }
    kept.push(ch);
  }

  const result: string[] = [];
  for (let i = kept.length - 1; i >= 0; i--) {
    if (kept[i] === '(' && open > 0) {
      open--;
      continue;
    }
    result.push(kept[i]);
  }
  return result.reverse().join('');
}
