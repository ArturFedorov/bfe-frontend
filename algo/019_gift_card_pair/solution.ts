/**
 * Gift Card Pair — reference solution.
 *
 * Two pointers converging from both ends of the sorted catalog. Because the
 * array is sorted, when the current sum is too small the only way to raise it
 * is to advance the low pointer (every pair using prices[lo] with a smaller
 * partner would be even smaller); symmetrically, a sum that is too large can
 * only be lowered by retreating the high pointer. No candidate is skipped.
 *
 * Time:  O(n) — the pointers meet after at most n - 1 moves.
 * Space: O(1).
 */

/**
 * Finds two catalog items that exactly spend a gift card balance.
 *
 * The catalog is sorted ascending, so convergent pointers from both ends
 * find a pair in one pass without extra memory.
 *
 * @param prices - item prices sorted ascending, may contain repeats
 * @param balance - the gift card balance to spend exactly
 * @returns indices `[i, j]` with `i < j` and `prices[i] + prices[j] === balance`,
 *          or `null` when no such pair exists
 */
export function giftCardPair(
  prices: number[],
  balance: number,
): [number, number] | null {
  let lo = 0;
  let hi = prices.length - 1;

  while (lo < hi) {
    const sum = prices[lo] + prices[hi];
    if (sum === balance) return [lo, hi];
    if (sum < balance) {
      lo++;
    } else {
      hi--;
    }
  }

  return null;
}
