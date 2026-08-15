import { minimapView, ComponentNode } from './minimap_view';

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

describe('minimapView', () => {
  it('returns the last id of each level', () => {
    const tree = n(
      'app',
      n('sidebar', n('nav')),
      n('content', n('card'), n('aside')),
    );
    expect(minimapView(tree)).toEqual(['app', 'content', 'aside']);
  });

  it('returns [] for an empty tree', () => {
    expect(minimapView(null)).toEqual([]);
  });

  it('returns a single id for a single node', () => {
    expect(minimapView(n('solo'))).toEqual(['solo']);
  });

  it('picks deep levels from the left subtree when the right is shallow', () => {
    const tree = n(
      'app',
      n('sidebar', n('nav', n('deepLink'))),
      n('content', n('card')),
    );
    expect(minimapView(tree)).toEqual(['app', 'content', 'card', 'deepLink']);
  });

  it('switches between subtrees level by level', () => {
    const tree = n(
      'root',
      n('a', n('a1', n('a2', n('a3')))),
      n('b', n('b1', n('b2'))),
    );
    // level 2: a1 then b1 → b1; level 3: a2 then b2 → b2; level 4: only a3
    expect(minimapView(tree)).toEqual(['root', 'b', 'b1', 'b2', 'a3']);
  });

  it('uses document order within a level, not subtree order', () => {
    const tree = n(
      'root',
      n('left', n('l1'), n('l2')),
      n('right'),
    );
    // level 1 ends with 'right'; level 2 exists only under 'left'
    expect(minimapView(tree)).toEqual(['root', 'right', 'l2']);
  });

  it('handles a wide flat tree', () => {
    const children: ComponentNode[] = [];
    for (let i = 0; i < 1000; i++) {
      children.push(n(`child${i}`));
    }
    const tree: ComponentNode = { id: 'root', children };
    expect(minimapView(tree)).toEqual(['root', 'child999']);
  });

  it('handles a deep chain of 5000 nodes', () => {
    const view = minimapView(buildChain(5000));
    expect(view).toHaveLength(5000);
    expect(view[0]).toBe('c0');
    expect(view[4999]).toBe('c4999');
  });

  it('handles a deep left branch under a wide right level', () => {
    const deepLeft = buildChain(50);
    const tree = n('root', deepLeft, n('r1'), n('r2'));
    const view = minimapView(tree);
    expect(view).toHaveLength(51);
    expect(view[0]).toBe('root');
    expect(view[1]).toBe('r2');
    // from level 2 downward only the deep left chain exists
    expect(view[2]).toBe('c1');
    expect(view[50]).toBe('c49');
  });
});
