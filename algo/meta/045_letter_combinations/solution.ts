const KEYPAD: Record<string, string> = {
  '2': 'abc',
  '3': 'def',
  '4': 'ghi',
  '5': 'jkl',
  '6': 'mno',
  '7': 'pqrs',
  '8': 'tuv',
  '9': 'wxyz',
};

/** Returns every letter string a phone-keypad digit sequence (2-9) could spell. */
export function letterCombinations(digits: string): string[] {
  if (digits.length === 0) return [];
  const result: string[] = [];

  // Choose one letter per digit, left to right.
  const backtrack = (index: number, prefix: string): void => {
    if (index === digits.length) {
      result.push(prefix);
      return;
    }
    for (const letter of KEYPAD[digits[index]]) {
      backtrack(index + 1, prefix + letter);
    }
  };

  backtrack(0, '');
  return result;
}
