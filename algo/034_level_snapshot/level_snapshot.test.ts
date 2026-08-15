import { levelSnapshot, ComponentNode } from './level_snapshot';

const n = (id: string, ...children: ComponentNode[]): ComponentNode => ({
  id,
  children,
});

const buildChain = (length: number): ComponentNode => {
  let node: ComponentNode = n(`c${length - 1}`);
  for (let i = length - 2; i >= 0; i--) {
    node = { id: `c${i}`, children: [node] };
  }
  return node;
};

describe('levelSnapshot', () => {
  it('groups a small tree by depth', () => {
    const tree = n(
      'app',
      n('nav', n('logo')),
      n('main', n('card'), n('aside')),
    );
    expect(levelSnapshot(tree)).toEqual([
      ['app'],
      ['nav', 'main'],
      ['logo', 'card', 'aside'],
    ]);
  });

  it('returns [] for an empty tree', () => {
    expect(levelSnapshot(null)).toEqual([]);
  });

  it('returns a single level for a single node', () => {
    expect(levelSnapshot(n('solo'))).toEqual([['solo']]);
  });

  it('preserves left-to-right order across parents', () => {
    const tree = n(
      'root',
      n('a', n('a1'), n('a2')),
      n('b', n('b1')),
      n('c', n('c1'), n('c2'), n('c3')),
    );
    expect(levelSnapshot(tree)).toEqual([
      ['root'],
      ['a', 'b', 'c'],
      ['a1', 'a2', 'b1', 'c1', 'c2', 'c3'],
    ]);
  });

  it('handles uneven branch depths without gaps', () => {
    const tree = n(
      'root',
      n('shallow'),
      n('deep', n('deeper', n('deepest'))),
    );
    expect(levelSnapshot(tree)).toEqual([
      ['root'],
      ['shallow', 'deep'],
      ['deeper'],
      ['deepest'],
    ]);
  });

  it('handles a wide flat tree', () => {
    const children: ComponentNode[] = [];
    const expected: string[] = [];
    for (let i = 0; i < 1000; i++) {
      children.push(n(`child${i}`));
      expected.push(`child${i}`);
    }
    const tree: ComponentNode = { id: 'root', children };
    expect(levelSnapshot(tree)).toEqual([['root'], expected]);
  });

  it('handles a deep chain of 5000 nodes (one id per level)', () => {
    const levels = levelSnapshot(buildChain(5000));
    expect(levels).toHaveLength(5000);
    expect(levels[0]).toEqual(['c0']);
    expect(levels[2500]).toEqual(['c2500']);
    expect(levels[4999]).toEqual(['c4999']);
  });

  it('does not merge levels when a middle branch dies out', () => {
    const tree = n(
      'root',
      n('left', n('leftLeaf')),
      n('mid'),
      n('right', n('rightChild', n('rightLeaf'))),
    );
    expect(levelSnapshot(tree)).toEqual([
      ['root'],
      ['left', 'mid', 'right'],
      ['leftLeaf', 'rightChild'],
      ['rightLeaf'],
    ]);
  });
});
