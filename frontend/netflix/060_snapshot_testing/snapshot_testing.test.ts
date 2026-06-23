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
});
