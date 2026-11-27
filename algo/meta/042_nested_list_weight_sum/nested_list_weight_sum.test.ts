import { depthSum, NestedList } from './nested_list_weight_sum';

describe('depthSum', () => {
  it('weights inner integers by depth 2', () => {
    expect(depthSum([[1, 1], 2, [1, 1]])).toBe(10);
  });

  it('handles increasing depth', () => {
    expect(depthSum([1, [4, [6]]])).toBe(27);
  });

  it('handles a single zero', () => {
    expect(depthSum([0])).toBe(0);
  });

  it('handles a flat list', () => {
    expect(depthSum([1, 2, 3])).toBe(6);
  });

  it('handles negative values', () => {
    expect(depthSum([-1, [-2, [3]]])).toBe(-1 - 4 + 9);
  });

  it('ignores empty inner lists', () => {
    expect(depthSum([[], [[]], 5, [[], [2]]])).toBe(5 + 2 * 3);
  });

  it('counts depth from list nesting, not position', () => {
    expect(depthSum([[[[7]]]])).toBe(28);
  });

  it('handles siblings at mixed depths', () => {
    expect(depthSum([1, [2, 3], [[4], 5], 6])).toBe(1 + 4 + 6 + 12 + 10 + 6);
  });

  it('handles depth 50', () => {
    let list: NestedList = [1];
    for (let i = 1; i < 50; i++) list = [list];
    expect(depthSum(list)).toBe(50);
  });

  it('does not mutate the input', () => {
    const input: NestedList = [1, [2, [3]]];
    depthSum(input);
    expect(input).toEqual([1, [2, [3]]]);
  });
});
