import { diffLockFiles, Lockfile } from './lockfile_differ';

const before: Lockfile = { a: '1.0.0', b: '2.0.0', c: '3.0.0' };
const after: Lockfile = { a: '1.0.0', b: '2.1.0', d: '4.0.0' };

// Helpers so the suite asserts on *contents* rather than a particular
// iteration order, which the implementation is free to choose.
const sorted = (xs: string[]) => [...xs].sort();
const byName = (xs: { name: string }[]) =>
  [...xs].sort((l, r) => l.name.localeCompare(r.name));

describe('diffLockFiles', () => {
  it('reports added packages', () => {
    expect(diffLockFiles(before, after).added).toEqual(['d']);
  });

  it('reports removed packages', () => {
    expect(diffLockFiles(before, after).removed).toEqual(['c']);
  });

  it('reports changed packages with version diff', () => {
    expect(diffLockFiles(before, after).changed).toEqual([
      { name: 'b', from: '2.0.0', to: '2.1.0' },
    ]);
  });

  describe('no-op diffs', () => {
    it('returns three empty buckets for two empty lockfiles', () => {
      expect(diffLockFiles({}, {})).toEqual({
        added: [],
        removed: [],
        changed: [],
      });
    });

    it('reports nothing when the lockfiles are identical', () => {
      const lock = { a: '1.0.0', b: '2.0.0' };
      expect(diffLockFiles(lock, { ...lock })).toEqual({
        added: [],
        removed: [],
        changed: [],
      });
    });

    it('does not treat a package as changed when its version is unchanged', () => {
      const diff = diffLockFiles({ a: '1.0.0' }, { a: '1.0.0' });
      expect(diff.changed).toEqual([]);
    });
  });

  describe('pure adds / pure removes', () => {
    it('treats every package as added when "before" is empty', () => {
      const diff = diffLockFiles({}, { a: '1.0.0', b: '2.0.0' });
      expect(sorted(diff.added)).toEqual(['a', 'b']);
      expect(diff.removed).toEqual([]);
      expect(diff.changed).toEqual([]);
    });

    it('treats every package as removed when "after" is empty', () => {
      const diff = diffLockFiles({ a: '1.0.0', b: '2.0.0' }, {});
      expect(sorted(diff.removed)).toEqual(['a', 'b']);
      expect(diff.added).toEqual([]);
      expect(diff.changed).toEqual([]);
    });
  });

  describe('mixed, multi-package diffs', () => {
    const big: Lockfile = {
      keep: '1.0.0',
      bump: '1.2.3',
      drop: '0.9.0',
      downgrade: '5.0.0',
    };
    const next: Lockfile = {
      keep: '1.0.0',
      bump: '1.3.0',
      downgrade: '4.0.0',
      fresh: '0.0.1',
      another: '2.0.0',
    };

    it('classifies adds, removes and changes simultaneously', () => {
      const diff = diffLockFiles(big, next);
      expect(sorted(diff.added)).toEqual(['another', 'fresh']);
      expect(sorted(diff.removed)).toEqual(['drop']);
      expect(byName(diff.changed)).toEqual([
        { name: 'bump', from: '1.2.3', to: '1.3.0' },
        { name: 'downgrade', from: '5.0.0', to: '4.0.0' },
      ]);
    });

    it('records a downgrade as a change just like an upgrade', () => {
      const diff = diffLockFiles({ a: '2.0.0' }, { a: '1.0.0' });
      expect(diff.changed).toEqual([{ name: 'a', from: '2.0.0', to: '1.0.0' }]);
    });

    it('never lists the same package in more than one bucket', () => {
      const diff = diffLockFiles(big, next);
      const names = [
        ...diff.added,
        ...diff.removed,
        ...diff.changed.map((c) => c.name),
      ];
      expect(new Set(names).size).toBe(names.length);
    });
  });

  describe('edge cases in version values', () => {
    it('detects a change even when versions differ only by prerelease tag', () => {
      const diff = diffLockFiles({ a: '1.0.0' }, { a: '1.0.0-rc.1' });
      expect(diff.changed).toEqual([
        { name: 'a', from: '1.0.0', to: '1.0.0-rc.1' },
      ]);
    });

    it('detects a change even when versions differ only by build metadata', () => {
      const diff = diffLockFiles(
        { a: '1.0.0+build.1' },
        { a: '1.0.0+build.2' },
      );
      expect(diff.changed).toEqual([
        { name: 'a', from: '1.0.0+build.1', to: '1.0.0+build.2' },
      ]);
    });

    it('does an exact string comparison rather than semver-equality', () => {
      // "1.0" and "1.0.0" are semver-equivalent but not string-equal.
      const diff = diffLockFiles({ a: '1.0' }, { a: '1.0.0' });
      expect(diff.changed).toEqual([{ name: 'a', from: '1.0', to: '1.0.0' }]);
    });
  });

  describe('immutability', () => {
    it('does not mutate either input lockfile', () => {
      const a = { x: '1.0.0', y: '2.0.0' };
      const b = { x: '1.1.0', z: '3.0.0' };
      const aCopy = { ...a };
      const bCopy = { ...b };
      diffLockFiles(a, b);
      expect(a).toEqual(aCopy);
      expect(b).toEqual(bCopy);
    });
  });
});
