/** Returns true if s can be segmented into a sequence of dictionary words. */
export function wordBreak(s: string, wordDict: string[]): boolean {
  const words = new Set(wordDict);
  const maxLen = wordDict.reduce((max, w) => Math.max(max, w.length), 0);
  // dp[i]: the prefix s[0, i) can be segmented.
  const dp: boolean[] = new Array<boolean>(s.length + 1).fill(false);
  dp[0] = true;

  for (let end = 1; end <= s.length; end++) {
    for (let start = end - 1; start >= Math.max(0, end - maxLen); start--) {
      if (dp[start] && words.has(s.slice(start, end))) {
        dp[end] = true;
        break;
      }
    }
  }

  return dp[s.length];
}
