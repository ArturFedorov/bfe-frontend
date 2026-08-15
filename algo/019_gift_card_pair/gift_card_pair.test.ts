import { giftCardPair } from './gift_card_pair';

const expectValidPair = (
  result: [number, number] | null,
  prices: number[],
  balance: number,
): void => {
  expect(result).not.toBeNull();
  const [i, j] = result as [number, number];
  expect(i).toBeLessThan(j);
  expect(i).toBeGreaterThanOrEqual(0);
  expect(j).toBeLessThan(prices.length);
  expect(prices[i] + prices[j]).toBe(balance);
};

describe('giftCardPair', () => {
  it('finds a pair in the middle of the catalog', () => {
    const prices = [5, 10, 25, 40, 60];
    expectValidPair(giftCardPair(prices, 50), prices, 50);
  });

  it('finds a pair made of the cheapest and most expensive items', () => {
    const prices = [5, 10, 25, 40, 60];
    expectValidPair(giftCardPair(prices, 65), prices, 65);
  });

  it('returns null when no pair spends the balance exactly', () => {
    expect(giftCardPair([5, 10, 25, 40, 60], 11)).toBeNull();
    expect(giftCardPair([5, 10, 25, 40, 60], 1000)).toBeNull();
    expect(giftCardPair([5, 10, 25, 40, 60], 1)).toBeNull();
  });

  it('returns null for an empty catalog', () => {
    expect(giftCardPair([], 10)).toBeNull();
  });

  it('returns null for a single-item catalog even when the price matches', () => {
    expect(giftCardPair([10], 10)).toBeNull();
    expect(giftCardPair([5], 10)).toBeNull();
  });

  it('pairs two items that share the same price', () => {
    const prices = [20, 20];
    expectValidPair(giftCardPair(prices, 40), prices, 40);
  });

  it('does not pair an item with itself', () => {
    // 25 + 25 = 50, but only one item costs 25.
    expect(giftCardPair([10, 25, 60], 50)).toBeNull();
  });

  it('handles repeated prices among other items', () => {
    const prices = [1, 3, 3, 3, 7, 9];
    expectValidPair(giftCardPair(prices, 6), prices, 6);
    expectValidPair(giftCardPair(prices, 10), prices, 10);
  });

  it('handles zero-priced items', () => {
    const prices = [0, 0, 5];
    expectValidPair(giftCardPair(prices, 0), prices, 0);
    expectValidPair(giftCardPair(prices, 5), prices, 5);
  });

  it('finds the only valid pair in a 100_000-item catalog in linear time', () => {
    const n = 100_000;
    const prices: number[] = [];
    for (let i = 0; i < n; i++) {
      prices.push(i * 2); // distinct even prices: 0, 2, 4, ...
    }
    const balance = 2 * (n - 1) + 2 * (n - 2); // only the two most expensive items
    expectValidPair(giftCardPair(prices, balance), prices, balance);
    // Odd balances are unreachable with even prices.
    expect(giftCardPair(prices, balance - 1)).toBeNull();
  });
});
