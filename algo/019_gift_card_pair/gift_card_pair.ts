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
export function giftCardPair(prices: number[], balance: number): [number, number] | null {
  // TODO: implement
  throw new Error('Not implemented');
}
