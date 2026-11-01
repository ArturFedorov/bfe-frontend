export type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; side: number }
  | { kind: 'rect'; width: number; height: number };

/**
 * Compute the area of a shape using a discriminated-union switch. The default
 * branch must be exhaustive: assign the value to `never` so adding a new shape
 * without handling it becomes a compile error.
 */
export function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2;
    case 'square':
      return shape.side ** 2;
    case 'rect':
      return shape.width * shape.height;
    default:
      const _exhaustive: never = shape;
      throw new Error(`Unknown shape`);
  }
}

/** A user-defined type guard narrowing `Shape` to the circle variant. */
export function isCircle(
  shape: Shape,
): shape is Extract<Shape, { kind: 'circle' }> {
  return shape.kind === 'circle';
}
