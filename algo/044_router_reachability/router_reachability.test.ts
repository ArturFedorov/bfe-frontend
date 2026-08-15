import { canReach, Router } from './router_reachability';

describe('canReach', () => {
  it('reaches a directly connected router', () => {
    const routers: Router[] = [
      { id: 'a', x: 0, y: 0, range: 10 },
      { id: 'b', x: 8, y: 0, range: 10 },
    ];
    expect(canReach(routers, 'a', 'b')).toBe(true);
  });

  it('reaches through a multi-hop chain', () => {
    const routers: Router[] = [
      { id: 'a', x: 0, y: 0, range: 5 },
      { id: 'b', x: 4, y: 0, range: 5 },
      { id: 'c', x: 8, y: 0, range: 5 },
      { id: 'd', x: 12, y: 0, range: 5 },
    ];
    expect(canReach(routers, 'a', 'd')).toBe(true);
  });

  it('returns true when source equals target', () => {
    const routers: Router[] = [{ id: 'solo', x: 0, y: 0, range: 0 }];
    expect(canReach(routers, 'solo', 'solo')).toBe(true);
  });

  it('returns false for an unreachable target', () => {
    const routers: Router[] = [
      { id: 'a', x: 0, y: 0, range: 1 },
      { id: 'b', x: 100, y: 100, range: 1 },
    ];
    expect(canReach(routers, 'a', 'b')).toBe(false);
  });

  it('returns false across disconnected clusters', () => {
    const routers: Router[] = [
      { id: 'a', x: 0, y: 0, range: 5 },
      { id: 'b', x: 3, y: 0, range: 5 },
      { id: 'x', x: 1000, y: 0, range: 5 },
      { id: 'y', x: 1003, y: 0, range: 5 },
    ];
    expect(canReach(routers, 'a', 'y')).toBe(false);
    expect(canReach(routers, 'x', 'y')).toBe(true);
  });

  it('returns false when source or target id does not exist', () => {
    const routers: Router[] = [{ id: 'a', x: 0, y: 0, range: 5 }];
    expect(canReach(routers, 'a', 'ghost')).toBe(false);
    expect(canReach(routers, 'ghost', 'a')).toBe(false);
    expect(canReach([], 'a', 'b')).toBe(false);
  });

  it('handles the empty router list', () => {
    expect(canReach([], 'a', 'a')).toBe(false);
  });

  it('counts a hop at exactly the range boundary', () => {
    const routers: Router[] = [
      { id: 'a', x: 0, y: 0, range: 5 },
      { id: 'b', x: 3, y: 4, range: 1 }, // distance exactly 5
    ];
    expect(canReach(routers, 'a', 'b')).toBe(true);
  });

  it('rejects a hop just beyond the range', () => {
    const routers: Router[] = [
      { id: 'a', x: 0, y: 0, range: 4.999 },
      { id: 'b', x: 3, y: 4, range: 1 },
    ];
    expect(canReach(routers, 'a', 'b')).toBe(false);
  });

  describe('asymmetric ranges (directed graph)', () => {
    it('reaches forward but not backward when ranges differ', () => {
      const routers: Router[] = [
        { id: 'big', x: 0, y: 0, range: 100 },
        { id: 'small', x: 50, y: 0, range: 1 },
      ];
      expect(canReach(routers, 'big', 'small')).toBe(true);
      expect(canReach(routers, 'small', 'big')).toBe(false);
    });

    it('does not use a reverse edge mid-chain', () => {
      // a → b works, but b cannot reach c; c could reach b though.
      const routers: Router[] = [
        { id: 'a', x: 0, y: 0, range: 10 },
        { id: 'b', x: 10, y: 0, range: 2 },
        { id: 'c', x: 20, y: 0, range: 15 },
      ];
      expect(canReach(routers, 'a', 'c')).toBe(false);
      expect(canReach(routers, 'c', 'a')).toBe(false); // c → b, but b cannot reach a
    });
  });

  it('terminates on cyclic topologies', () => {
    const routers: Router[] = [
      { id: 'a', x: 0, y: 0, range: 10 },
      { id: 'b', x: 10, y: 0, range: 10 },
      { id: 'c', x: 5, y: 8, range: 10 },
      { id: 'far', x: 500, y: 500, range: 1 },
    ];
    // a, b, c form a cycle; far is unreachable — must not loop forever.
    expect(canReach(routers, 'a', 'far')).toBe(false);
  });

  it('handles a zero-range router as a sink', () => {
    const routers: Router[] = [
      { id: 'a', x: 0, y: 0, range: 10 },
      { id: 'mute', x: 5, y: 0, range: 0 },
      { id: 'b', x: 10, y: 0, range: 10 },
    ];
    expect(canReach(routers, 'a', 'mute')).toBe(true);
    expect(canReach(routers, 'mute', 'b')).toBe(false);
  });

  it('traverses a large 2000-router chain', () => {
    const routers: Router[] = [];
    for (let i = 0; i < 2000; i++) {
      routers.push({ id: `r${i}`, x: i * 10, y: 0, range: 10 });
    }
    expect(canReach(routers, 'r0', 'r1999')).toBe(true);
    // break the chain in the middle: r1000 too weak to bridge the gap
    routers[1000] = { id: 'r1000', x: 1000 * 10, y: 0, range: 3 };
    expect(canReach(routers, 'r0', 'r1999')).toBe(false);
    expect(canReach(routers, 'r1999', 'r0')).toBe(false);
  });
});
