import { buildServiceMap, ServiceCall } from './service_map';

describe('buildServiceMap', () => {
  it('builds adjacency and degrees for a small call log', () => {
    const calls: ServiceCall[] = [
      { from: 'web', to: 'auth' },
      { from: 'web', to: 'billing' },
      { from: 'billing', to: 'auth' },
    ];
    expect(buildServiceMap(calls)).toEqual({
      adjacency: { web: ['auth', 'billing'], billing: ['auth'], auth: [] },
      inDegree: { web: 0, auth: 2, billing: 1 },
      outDegree: { web: 2, auth: 0, billing: 1 },
    });
  });

  it('returns empty records for an empty call log', () => {
    expect(buildServiceMap([])).toEqual({
      adjacency: {},
      inDegree: {},
      outDegree: {},
    });
  });

  it('includes call-only targets with empty adjacency and zero out-degree', () => {
    const result = buildServiceMap([{ from: 'gateway', to: 'search' }]);
    expect(result.adjacency.search).toEqual([]);
    expect(result.outDegree.search).toBe(0);
    expect(result.inDegree.search).toBe(1);
    expect(result.inDegree.gateway).toBe(0);
  });

  it('deduplicates repeated calls between the same pair', () => {
    const calls: ServiceCall[] = [
      { from: 'a', to: 'b' },
      { from: 'a', to: 'b' },
      { from: 'a', to: 'b' },
    ];
    expect(buildServiceMap(calls)).toEqual({
      adjacency: { a: ['b'], b: [] },
      inDegree: { a: 0, b: 1 },
      outDegree: { a: 1, b: 0 },
    });
  });

  it('preserves first-seen order in neighbor lists', () => {
    const calls: ServiceCall[] = [
      { from: 's', to: 'z' },
      { from: 's', to: 'a' },
      { from: 's', to: 'z' },
      { from: 's', to: 'm' },
    ];
    expect(buildServiceMap(calls).adjacency.s).toEqual(['z', 'a', 'm']);
  });

  it('handles a self-call as a single edge on both degrees', () => {
    const result = buildServiceMap([{ from: 'cron', to: 'cron' }]);
    expect(result.adjacency.cron).toEqual(['cron']);
    expect(result.inDegree.cron).toBe(1);
    expect(result.outDegree.cron).toBe(1);
  });

  it('handles a cycle between services', () => {
    const calls: ServiceCall[] = [
      { from: 'a', to: 'b' },
      { from: 'b', to: 'c' },
      { from: 'c', to: 'a' },
    ];
    const result = buildServiceMap(calls);
    expect(result.inDegree).toEqual({ a: 1, b: 1, c: 1 });
    expect(result.outDegree).toEqual({ a: 1, b: 1, c: 1 });
  });

  it('keeps disconnected clusters independent', () => {
    const calls: ServiceCall[] = [
      { from: 'a', to: 'b' },
      { from: 'x', to: 'y' },
    ];
    const result = buildServiceMap(calls);
    expect(Object.keys(result.adjacency).sort()).toEqual(['a', 'b', 'x', 'y']);
    expect(result.adjacency.a).toEqual(['b']);
    expect(result.adjacency.x).toEqual(['y']);
  });

  it('handles a single service calling itself only (single node)', () => {
    const result = buildServiceMap([{ from: 'solo', to: 'solo' }]);
    expect(Object.keys(result.adjacency)).toEqual(['solo']);
  });

  it('processes a large call log in linear time', () => {
    const n = 50000;
    const calls: ServiceCall[] = [];
    // chain: s0 -> s1 -> ... -> s{n}, plus duplicates of every edge
    for (let i = 0; i < n; i++) {
      calls.push({ from: `s${i}`, to: `s${i + 1}` });
      calls.push({ from: `s${i}`, to: `s${i + 1}` });
    }
    const result = buildServiceMap(calls);
    expect(Object.keys(result.adjacency)).toHaveLength(n + 1);
    expect(result.adjacency.s0).toEqual(['s1']);
    expect(result.outDegree[`s${n}`]).toBe(0);
    expect(result.inDegree[`s${n}`]).toBe(1);
    expect(result.inDegree.s0).toBe(0);
    expect(result.outDegree.s25000).toBe(1);
  });
});
