import { detectBreakingChanges, ApiSurface } from './breaking_change_detector';

const before: ApiSurface = {
  add: '(a: number, b: number) => number',
  sub: '(a: number, b: number) => number',
  deprecated: '() => void',
};
const after: ApiSurface = {
  add: '(a: number, b: number) => number',
  sub: '(a: number) => number', // signature changed
  brandNew: '() => void',
};

describe('detectBreakingChanges', () => {
  it('classifies removed, changed and added exports', () => {
    expect(detectBreakingChanges(before, after)).toEqual({
      removed: ['deprecated'],
      changed: ['sub'],
      added: ['brandNew'],
    });
  });

  it('reports nothing for identical surfaces', () => {
    expect(detectBreakingChanges(before, before)).toEqual({
      removed: [],
      changed: [],
      added: [],
    });
  });
});
