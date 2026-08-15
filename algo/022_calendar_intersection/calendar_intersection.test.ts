import { calendarIntersection, Interval } from './calendar_intersection';

const iv = (start: number, end: number): Interval => ({ start, end });

describe('calendarIntersection', () => {
  it('finds overlaps when one interval spans several on the other side', () => {
    const a = [iv(0, 30), iv(60, 90)];
    const b = [iv(20, 70)];
    expect(calendarIntersection(a, b)).toEqual([iv(20, 30), iv(60, 70)]);
  });

  it('finds a simple partial overlap', () => {
    expect(calendarIntersection([iv(10, 20)], [iv(15, 25)])).toEqual([iv(15, 20)]);
  });

  it('handles full containment', () => {
    expect(calendarIntersection([iv(0, 100)], [iv(20, 30)])).toEqual([iv(20, 30)]);
    expect(calendarIntersection([iv(20, 30)], [iv(0, 100)])).toEqual([iv(20, 30)]);
  });

  it('returns identical calendars unchanged', () => {
    const a = [iv(1, 5), iv(10, 15)];
    const b = [iv(1, 5), iv(10, 15)];
    expect(calendarIntersection(a, b)).toEqual([iv(1, 5), iv(10, 15)]);
  });

  it('excludes touching endpoints', () => {
    expect(calendarIntersection([iv(0, 10)], [iv(10, 20)])).toEqual([]);
    expect(calendarIntersection([iv(10, 20)], [iv(0, 10)])).toEqual([]);
  });

  it('returns [] when calendars never overlap', () => {
    const a = [iv(0, 5), iv(20, 25)];
    const b = [iv(6, 10), iv(30, 40)];
    expect(calendarIntersection(a, b)).toEqual([]);
  });

  it('returns [] when either calendar is empty', () => {
    expect(calendarIntersection([], [iv(5, 9)])).toEqual([]);
    expect(calendarIntersection([iv(5, 9)], [])).toEqual([]);
    expect(calendarIntersection([], [])).toEqual([]);
  });

  it('handles single-interval calendars', () => {
    expect(calendarIntersection([iv(3, 8)], [iv(5, 6)])).toEqual([iv(5, 6)]);
  });

  it('handles many small intervals against one long one', () => {
    const a = [iv(0, 100)];
    const b = [iv(5, 10), iv(20, 25), iv(95, 120)];
    expect(calendarIntersection(a, b)).toEqual([iv(5, 10), iv(20, 25), iv(95, 100)]);
  });

  it('does not mutate the input calendars', () => {
    const a = [iv(0, 30)];
    const b = [iv(20, 70)];
    calendarIntersection(a, b);
    expect(a).toEqual([iv(0, 30)]);
    expect(b).toEqual([iv(20, 70)]);
  });

  it('returns new interval objects, not references into the inputs', () => {
    const a = [iv(0, 30)];
    const b = [iv(0, 30)];
    const result = calendarIntersection(a, b);
    expect(result).toEqual([iv(0, 30)]);
    expect(result[0]).not.toBe(a[0]);
    expect(result[0]).not.toBe(b[0]);
  });

  it('intersects 100_000-interval calendars in linear time', () => {
    const n = 100_000;
    const a: Interval[] = [];
    const b: Interval[] = [];
    for (let i = 0; i < n; i++) {
      a.push(iv(i * 10, i * 10 + 6)); // [0,6), [10,16), ...
      b.push(iv(i * 10 + 4, i * 10 + 9)); // [4,9), [14,19), ...
    }
    const result = calendarIntersection(a, b);
    expect(result).toHaveLength(n);
    expect(result[0]).toEqual(iv(4, 6));
    expect(result[n - 1]).toEqual(iv((n - 1) * 10 + 4, (n - 1) * 10 + 6));
    for (let i = 1; i < result.length; i++) {
      expect(result[i].start).toBeGreaterThan(result[i - 1].end - 1);
      expect(result[i].start).toBeLessThan(result[i].end);
    }
  });
});
