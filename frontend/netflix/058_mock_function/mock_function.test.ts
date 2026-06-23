import { fn } from './mock_function';

describe('mock fn', () => {
  it('records calls, args and results', () => {
    const m = fn<[number, number], number>((a, b) => a + b);
    expect(m(1, 2)).toBe(3);
    expect(m(3, 4)).toBe(7);
    expect(m.calls).toEqual([
      [1, 2],
      [3, 4],
    ]);
    expect(m.results).toEqual([3, 7]);
  });

  it('supports mockReturnValue and mockImplementation', () => {
    const m = fn<[], string>().mockReturnValue('x');
    expect(m()).toBe('x');
    m.mockImplementation(() => 'y');
    expect(m()).toBe('y');
  });
});
