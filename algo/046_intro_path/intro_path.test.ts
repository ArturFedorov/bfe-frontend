import { introPath, Connection } from './intro_path';

/** Assert that path is a valid chain over the given connections. */
function expectValidChain(
  path: string[],
  connections: Connection[],
  from: string,
  to: string,
  expectedLength: number
): void {
  expect(path).toHaveLength(expectedLength);
  expect(path[0]).toBe(from);
  expect(path[path.length - 1]).toBe(to);
  const edges = new Set<string>();
  for (const [a, b] of connections) {
    edges.add(`${a}->${b}`);
    edges.add(`${b}->${a}`);
  }
  for (let i = 0; i + 1 < path.length; i++) {
    expect(edges.has(`${path[i]}->${path[i + 1]}`)).toBe(true);
  }
}

describe('introPath', () => {
  it('finds a direct connection', () => {
    const connections: Connection[] = [['ana', 'bo']];
    expect(introPath(connections, 'ana', 'bo')).toEqual(['ana', 'bo']);
  });

  it('finds the unique shortest chain', () => {
    const connections: Connection[] = [
      ['ana', 'bo'],
      ['bo', 'kim'],
      ['ana', 'raj'],
      ['raj', 'sam'],
      ['sam', 'kim'],
    ];
    expect(introPath(connections, 'ana', 'kim')).toEqual(['ana', 'bo', 'kim']);
  });

  it('returns one of the tied shortest chains when several exist', () => {
    const connections: Connection[] = [
      ['ana', 'bo'],
      ['bo', 'kim'],
      ['ana', 'raj'],
      ['raj', 'kim'],
    ];
    const path = introPath(connections, 'ana', 'kim');
    expect(path).not.toBeNull();
    expectValidChain(path as string[], connections, 'ana', 'kim', 3);
  });

  it('works in both directions (undirected edges)', () => {
    const connections: Connection[] = [
      ['ana', 'bo'],
      ['bo', 'kim'],
    ];
    expect(introPath(connections, 'kim', 'ana')).toEqual(['kim', 'bo', 'ana']);
  });

  it('returns [from] when from equals to', () => {
    const connections: Connection[] = [['ana', 'bo']];
    expect(introPath(connections, 'ana', 'ana')).toEqual(['ana']);
    expect(introPath([], 'ghost', 'ghost')).toEqual(['ghost']);
  });

  it('returns null when the target is in another component', () => {
    const connections: Connection[] = [
      ['ana', 'bo'],
      ['zoe', 'max'],
    ];
    expect(introPath(connections, 'ana', 'zoe')).toBeNull();
  });

  it('returns null for unknown people', () => {
    const connections: Connection[] = [['ana', 'bo']];
    expect(introPath(connections, 'ana', 'ghost')).toBeNull();
    expect(introPath(connections, 'ghost', 'ana')).toBeNull();
  });

  it('returns null on an empty connection list when from !== to', () => {
    expect(introPath([], 'ana', 'bo')).toBeNull();
  });

  it('does not loop forever on cycles', () => {
    const connections: Connection[] = [
      ['a', 'b'],
      ['b', 'c'],
      ['c', 'a'],
      ['c', 'd'],
    ];
    expect(introPath(connections, 'a', 'd')).toEqual(['a', 'c', 'd']);
  });

  it('handles duplicate connection pairs', () => {
    const connections: Connection[] = [
      ['ana', 'bo'],
      ['ana', 'bo'],
      ['bo', 'ana'],
      ['bo', 'kim'],
    ];
    expect(introPath(connections, 'ana', 'kim')).toEqual(['ana', 'bo', 'kim']);
  });

  it('prefers the shorter chain over a longer detour', () => {
    const connections: Connection[] = [
      ['a', 'b'],
      ['b', 'c'],
      ['c', 'd'],
      ['d', 'e'],
      ['a', 'x'],
      ['x', 'e'],
    ];
    expect(introPath(connections, 'a', 'e')).toEqual(['a', 'x', 'e']);
  });

  it('reconstructs a path across a large 50k-person chain', () => {
    const n = 50000;
    const connections: Connection[] = [];
    for (let i = 0; i < n; i++) {
      connections.push([`p${i}`, `p${i + 1}`]);
    }
    const path = introPath(connections, 'p0', `p${n}`);
    expect(path).not.toBeNull();
    expect(path).toHaveLength(n + 1);
    expect((path as string[])[0]).toBe('p0');
    expect((path as string[])[n]).toBe(`p${n}`);
    expect((path as string[])[25000]).toBe('p25000');
  });
});
