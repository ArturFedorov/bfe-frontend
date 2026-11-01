import { area, isCircle, Shape } from './type_narrowing';

// Compile-time assertion helpers (same pattern as the other TypeScript tasks).
type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;
type Expect<T extends true> = T;

type Circle = Extract<Shape, { kind: 'circle' }>;

describe('area', () => {
  it.each<[Shape, number]>([
    [{ kind: 'circle', radius: 1 }, Math.PI],
    [{ kind: 'circle', radius: 2 }, Math.PI * 4],
    [{ kind: 'square', side: 2 }, 4],
    [{ kind: 'square', side: 0.5 }, 0.25],
    [{ kind: 'rect', width: 2, height: 3 }, 6],
    [{ kind: 'rect', width: 3, height: 2 }, 6],
  ])('computes the area of %o', (shape, expected) => {
    expect(area(shape)).toBeCloseTo(expected);
  });

  it('handles degenerate shapes with zero size', () => {
    expect(area({ kind: 'circle', radius: 0 })).toBe(0);
    expect(area({ kind: 'square', side: 0 })).toBe(0);
    expect(area({ kind: 'rect', width: 0, height: 10 })).toBe(0);
  });

  it('is commutative for rectangles', () => {
    expect(area({ kind: 'rect', width: 7, height: 13 })).toBe(
      area({ kind: 'rect', width: 13, height: 7 }),
    );
  });

  it('always returns a finite number for every variant', () => {
    const shapes: Shape[] = [
      { kind: 'circle', radius: 5 },
      { kind: 'square', side: 5 },
      { kind: 'rect', width: 5, height: 5 },
    ];
    for (const shape of shapes) {
      expect(Number.isFinite(area(shape))).toBe(true);
    }
  });

  it('composes with array reducers', () => {
    const shapes: Shape[] = [
      { kind: 'square', side: 2 }, // 4
      { kind: 'rect', width: 2, height: 5 }, // 10
    ];
    const total = shapes.reduce((sum, shape) => sum + area(shape), 0);
    expect(total).toBe(14);
  });
});

describe('isCircle', () => {
  it('returns true only for the circle variant', () => {
    expect(isCircle({ kind: 'circle', radius: 1 })).toBe(true);
    expect(isCircle({ kind: 'square', side: 1 })).toBe(false);
    expect(isCircle({ kind: 'rect', width: 1, height: 1 })).toBe(false);
  });

  it('narrows the type inside the guard so circle members are accessible', () => {
    const shape: Shape = { kind: 'circle', radius: 4 };
    if (isCircle(shape)) {
      // Inside this branch TypeScript narrows `shape` to the circle variant.
      type _ = Expect<Equal<typeof shape, Circle>>;
      expect(shape.radius).toBe(4);
    } else {
      throw new Error('expected the guard to narrow to a circle');
    }
  });

  it('narrows arrays when used as a filter predicate', () => {
    const shapes: Shape[] = [
      { kind: 'circle', radius: 1 },
      { kind: 'square', side: 2 },
      { kind: 'circle', radius: 3 },
      { kind: 'rect', width: 2, height: 2 },
    ];

    const circles = shapes.filter(isCircle);
    type _ = Expect<Equal<typeof circles, Circle[]>>;

    expect(circles).toHaveLength(2);
    // `.radius` is only reachable because the array was narrowed to Circle[].
    expect(circles.map((c) => c.radius)).toEqual([1, 3]);
  });
});
