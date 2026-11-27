/** Returns the minimum number of parenthesis insertions that make `s` valid. */
export function minAddToMakeValid(s: string): number {
  // Unmatched ')' each need a '(' inserted; leftover '(' each need a ')'.
  let open = 0;
  let missingOpen = 0;
  for (const ch of s) {
    if (ch === '(') {
      open++;
    } else if (open > 0) {
      open--;
    } else {
      missingOpen++;
    }
  }
  return open + missingOpen;
}
