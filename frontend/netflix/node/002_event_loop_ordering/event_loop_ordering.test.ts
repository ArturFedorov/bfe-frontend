import {
  observeEventLoopOrder,
  observeMicrotaskInterleaving,
  Phase,
} from './event_loop_ordering';

describe('observeEventLoopOrder', () => {
  it('fires sync → nextTick → promise → setImmediate → setTimeout', async () => {
    const order = await observeEventLoopOrder();
    expect(order).toEqual<Phase[]>([
      'sync',
      'nextTick',
      'promise',
      'setImmediate',
      'setTimeout',
    ]);
  });

  it('is deterministic across repeated runs (the whole point of the harness)', async () => {
    for (let i = 0; i < 10; i += 1) {
      const order = await observeEventLoopOrder();
      expect(order).toEqual(['sync', 'nextTick', 'promise', 'setImmediate', 'setTimeout']);
    }
  });

  it('records exactly five labels with no duplicates', async () => {
    const order = await observeEventLoopOrder();
    expect(order).toHaveLength(5);
    expect(new Set(order).size).toBe(5);
  });
});

describe('observeMicrotaskInterleaving', () => {
  it('drains the nextTick queue fully before the promise queue', async () => {
    const order = await observeMicrotaskInterleaving();
    expect(order).toEqual(['tickA', 'tickB', 'promiseA', 'promiseB']);
  });

  it('is deterministic across repeated runs', async () => {
    for (let i = 0; i < 10; i += 1) {
      expect(await observeMicrotaskInterleaving()).toEqual([
        'tickA',
        'tickB',
        'promiseA',
        'promiseB',
      ]);
    }
  });

  it('runs tickB (scheduled second, from inside tickA) before promiseA (scheduled first)', async () => {
    const order = await observeMicrotaskInterleaving();
    expect(order.indexOf('tickB')).toBeLessThan(order.indexOf('promiseA'));
  });
});
