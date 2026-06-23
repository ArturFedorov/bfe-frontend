import { area, isCircle } from './type_narrowing';

describe('area', () => {
  it('computes area per shape kind', () => {
    expect(area({ kind: 'circle', radius: 1 })).toBeCloseTo(Math.PI);
    expect(area({ kind: 'square', side: 2 })).toBe(4);
    expect(area({ kind: 'rect', width: 2, height: 3 })).toBe(6);
  });
});

describe('isCircle', () => {
  it('narrows to the circle variant', () => {
    expect(isCircle({ kind: 'circle', radius: 1 })).toBe(true);
    expect(isCircle({ kind: 'square', side: 1 })).toBe(false);
  });
});
