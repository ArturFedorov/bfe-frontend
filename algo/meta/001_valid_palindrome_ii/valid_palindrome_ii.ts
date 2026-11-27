/** Returns true if `s` can become a palindrome after deleting at most one character. */

export function validPalindrome(s: string): boolean {
  const isPalindrome = (l: number, r: number): boolean => {
    while (l < r) {
      if (s[l] !== s[r]) return false;
    }

    return true;
  };

  let left = 0;
  let right = s.length - 1;

  while (left < right) {
    if (s[left] !== s[right])
      return isPalindrome(left + 1, right) || isPalindrome(left, right - 1);
    left++;
    right--;
  }

  return true;
}
