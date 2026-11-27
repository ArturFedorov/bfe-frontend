function isPalindromeRange(s: string, lo: number, hi: number): boolean {
  while (lo < hi) {
    if (s[lo] !== s[hi]) return false;
    lo++;
    hi--;
  }
  return true;
}

/** Returns true if `s` can become a palindrome after deleting at most one character. */
export function validPalindrome(s: string): boolean {
  let lo = 0;
  let hi = s.length - 1;
  while (lo < hi) {
    if (s[lo] !== s[hi]) {
      // First mismatch: one of the two chars must go — try both, once.
      return (
        isPalindromeRange(s, lo + 1, hi) || isPalindromeRange(s, lo, hi - 1)
      );
    }
    lo++;
    hi--;
  }
  return true;
}
