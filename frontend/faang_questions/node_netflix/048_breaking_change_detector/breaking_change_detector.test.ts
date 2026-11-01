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

  it('reports nothing for two empty surfaces', () => {
    expect(detectBreakingChanges({}, {})).toEqual({
      removed: [],
      changed: [],
      added: [],
    });
  });

  it('treats every export as removed when the new surface is empty', () => {
    expect(detectBreakingChanges(before, {})).toEqual({
      removed: ['add', 'sub', 'deprecated'],
      changed: [],
      added: [],
    });
  });

  it('treats every export as added when the old surface is empty', () => {
    expect(detectBreakingChanges({}, after)).toEqual({
      removed: [],
      changed: [],
      added: ['add', 'sub', 'brandNew'],
    });
  });

  it('detects a single signature change with nothing else different', () => {
    const beforeApi: ApiSurface = { fn: '(a: number) => number' };
    const afterApi: ApiSurface = { fn: '(a: string) => number' };
    expect(detectBreakingChanges(beforeApi, afterApi)).toEqual({
      removed: [],
      changed: ['fn'],
      added: [],
    });
  });

  it('is sensitive to whitespace differences in signatures', () => {
    const beforeApi: ApiSurface = { fn: '(a: number) => number' };
    const afterApi: ApiSurface = { fn: '(a: number)  => number' };
    expect(detectBreakingChanges(beforeApi, afterApi)).toEqual({
      removed: [],
      changed: ['fn'],
      added: [],
    });
  });

  it('treats names as case-sensitive', () => {
    const beforeApi: ApiSurface = { Fn: '() => void' };
    const afterApi: ApiSurface = { fn: '() => void' };
    expect(detectBreakingChanges(beforeApi, afterApi)).toEqual({
      removed: ['Fn'],
      changed: [],
      added: ['fn'],
    });
  });

  it('handles a surface with only additions and no overlap', () => {
    const beforeApi: ApiSurface = { a: '() => void' };
    const afterApi: ApiSurface = {
      a: '() => void',
      b: '() => void',
      c: '() => void',
    };
    expect(detectBreakingChanges(beforeApi, afterApi)).toEqual({
      removed: [],
      changed: [],
      added: ['b', 'c'],
    });
  });

  it('handles multiple simultaneous removals, changes and additions', () => {
    const beforeApi: ApiSurface = {
      keep: '() => void',
      drop1: '() => void',
      drop2: '() => void',
      change1: '(a: number) => void',
      change2: '(a: string) => void',
    };
    const afterApi: ApiSurface = {
      keep: '() => void',
      change1: '(a: string) => void',
      change2: '(a: number) => void',
      new1: '() => void',
      new2: '() => void',
    };
    const result = detectBreakingChanges(beforeApi, afterApi);
    expect(result.removed.sort()).toEqual(['drop1', 'drop2']);
    expect(result.changed.sort()).toEqual(['change1', 'change2']);
    expect(result.added.sort()).toEqual(['new1', 'new2']);
  });

  it('does not mutate the input surfaces', () => {
    const beforeApi: ApiSurface = { ...before };
    const afterApi: ApiSurface = { ...after };
    const beforeSnapshot = { ...beforeApi };
    const afterSnapshot = { ...afterApi };
    detectBreakingChanges(beforeApi, afterApi);
    expect(beforeApi).toEqual(beforeSnapshot);
    expect(afterApi).toEqual(afterSnapshot);
  });
});
