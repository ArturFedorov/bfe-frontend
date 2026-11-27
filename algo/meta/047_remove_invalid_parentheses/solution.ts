const isValid = (str: string): boolean => {
  let balance = 0;
  for (const ch of str) {
    if (ch === '(') balance++;
    else if (ch === ')' && --balance < 0) return false;
  }
  return balance === 0;
};

/** Returns every distinct valid string obtainable by removing the minimum number of parentheses. */
export function removeInvalidParentheses(s: string): string[] {
  // Count the exact number of '(' and ')' that must be removed.
  let extraOpen = 0;
  let extraClose = 0;
  for (const ch of s) {
    if (ch === '(') extraOpen++;
    else if (ch === ')') {
      if (extraOpen > 0) extraOpen--;
      else extraClose++;
    }
  }

  const result: string[] = [];
  const remove = (str: string, start: number, open: number, close: number) => {
    if (open === 0 && close === 0) {
      if (isValid(str)) result.push(str);
      return;
    }
    for (let i = start; i < str.length; i++) {
      // Removing any one of a run of identical chars gives the same string.
      if (i > start && str[i] === str[i - 1]) continue;
      const rest = str.slice(0, i) + str.slice(i + 1);
      if (str[i] === ')' && close > 0) remove(rest, i, open, close - 1);
      else if (str[i] === '(' && open > 0) remove(rest, i, open - 1, close);
    }
  };

  remove(s, 0, extraOpen, extraClose);
  return [...new Set(result)];
}
