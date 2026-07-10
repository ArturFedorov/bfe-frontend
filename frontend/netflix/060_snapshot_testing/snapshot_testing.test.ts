import { toMatchSnapshot, SnapshotStore } from './snapshot_testing';

describe('toMatchSnapshot', () => {
  it('stores on first run, then matches', () => {
    const store: SnapshotStore = {};

    const first = toMatchSnapshot(store, 'a', { x: 1 });
    expect(first.stored).toBe(true);
    expect(first.pass).toBe(true);

    const second = toMatchSnapshot(store, 'a', { x: 1 });
    expect(second.stored).toBe(false);
    expect(second.pass).toBe(true);

    const third = toMatchSnapshot(store, 'a', { x: 2 });
    expect(third.pass).toBe(false);
  });

  it('overwrites the snapshot with update', () => {
    const store: SnapshotStore = {};
    toMatchSnapshot(store, 'a', { x: 1 });
    const updated = toMatchSnapshot(store, 'a', { x: 2 }, { update: true });
    expect(updated.pass).toBe(true);
  });

  it('writes a serialized entry into the store on first run', () => {
    const store: SnapshotStore = {};
    toMatchSnapshot(store, 'a', { x: 1 });
    expect(typeof store['a']).toBe('string');
    expect(store['a'].length).toBeGreaterThan(0);
  });

  it('does not report a mismatch as a new stored snapshot', () => {
    const store: SnapshotStore = {};
    toMatchSnapshot(store, 'a', { x: 1 });
    const mismatch = toMatchSnapshot(store, 'a', { x: 2 });
    expect(mismatch.stored).toBe(false);
  });

  it('keeps snapshots under different keys independent', () => {
    const store: SnapshotStore = {};
    const a = toMatchSnapshot(store, 'a', { x: 1 });
    const b = toMatchSnapshot(store, 'b', { x: 1 });
    expect(a.stored).toBe(true);
    expect(b.stored).toBe(true);

    const aAgain = toMatchSnapshot(store, 'a', { x: 1 });
    const bMismatch = toMatchSnapshot(store, 'b', { x: 2 });
    expect(aAgain.pass).toBe(true);
    expect(bMismatch.pass).toBe(false);
  });

  it('treats a first run with update: true as a normal store', () => {
    const store: SnapshotStore = {};
    const result = toMatchSnapshot(store, 'a', { x: 1 }, { update: true });
    expect(result.stored).toBe(true);
    expect(result.pass).toBe(true);
  });

  it('matches the newly updated value on the next run', () => {
    const store: SnapshotStore = {};
    toMatchSnapshot(store, 'a', { x: 1 });
    toMatchSnapshot(store, 'a', { x: 2 }, { update: true });
    const after = toMatchSnapshot(store, 'a', { x: 2 });
    expect(after.pass).toBe(true);
    expect(after.stored).toBe(false);
  });

  it('matches for primitive values, not just objects', () => {
    const store: SnapshotStore = {};
    toMatchSnapshot(store, 'num', 42);
    toMatchSnapshot(store, 'str', 'hello');
    toMatchSnapshot(store, 'bool', true);
    expect(toMatchSnapshot(store, 'num', 42).pass).toBe(true);
    expect(toMatchSnapshot(store, 'str', 'hello').pass).toBe(true);
    expect(toMatchSnapshot(store, 'bool', true).pass).toBe(true);
    expect(toMatchSnapshot(store, 'num', 43).pass).toBe(false);
  });

  it('matches for array values and detects element changes', () => {
    const store: SnapshotStore = {};
    toMatchSnapshot(store, 'list', [1, 2, 3]);
    expect(toMatchSnapshot(store, 'list', [1, 2, 3]).pass).toBe(true);
    expect(toMatchSnapshot(store, 'list', [1, 2, 4]).pass).toBe(false);
  });

  it('detects a mismatch caused only by nested structure differences', () => {
    const store: SnapshotStore = {};
    toMatchSnapshot(store, 'a', { user: { name: 'ada', age: 30 } });
    const result = toMatchSnapshot(store, 'a', {
      user: { name: 'ada', age: 31 },
    });
    expect(result.pass).toBe(false);
  });
});
