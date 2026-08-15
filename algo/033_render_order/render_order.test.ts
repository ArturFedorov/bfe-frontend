import { renderOrder, RenderNode } from './render_order';

const n = (
  id: string,
  left: RenderNode | null = null,
  right: RenderNode | null = null,
): RenderNode => ({ id, left, right });

const buildLeftChain = (length: number): RenderNode => {
  let node = n(`c${length - 1}`);
  for (let i = length - 2; i >= 0; i--) {
    node = n(`c${i}`, node, null);
  }
  return node;
};

const buildRightChain = (length: number): RenderNode => {
  let node = n(`c${length - 1}`);
  for (let i = length - 2; i >= 0; i--) {
    node = n(`c${i}`, null, node);
  }
  return node;
};

describe('renderOrder', () => {
  it('returns all three orders for a small tree', () => {
    const tree = n('root', n('a', null, n('b')), n('c'));
    expect(renderOrder(tree)).toEqual({
      preOrder: ['root', 'a', 'b', 'c'],
      inOrder: ['a', 'b', 'root', 'c'],
      postOrder: ['b', 'a', 'c', 'root'],
    });
  });

  it('returns empty arrays for an empty tree', () => {
    expect(renderOrder(null)).toEqual({
      preOrder: [],
      inOrder: [],
      postOrder: [],
    });
  });

  it('returns single-element arrays for a single node', () => {
    expect(renderOrder(n('solo'))).toEqual({
      preOrder: ['solo'],
      inOrder: ['solo'],
      postOrder: ['solo'],
    });
  });

  it('handles a full three-level tree', () => {
    const tree = n(
      'f',
      n('b', n('a'), n('d', n('c'), n('e'))),
      n('g', null, n('i', n('h'))),
    );
    expect(renderOrder(tree)).toEqual({
      preOrder: ['f', 'b', 'a', 'd', 'c', 'e', 'g', 'i', 'h'],
      inOrder: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'],
      postOrder: ['a', 'c', 'e', 'd', 'b', 'h', 'i', 'g', 'f'],
    });
  });

  it('handles nodes with only a right child (the in-order trap)', () => {
    const tree = n('a', null, n('b', null, n('c')));
    expect(renderOrder(tree)).toEqual({
      preOrder: ['a', 'b', 'c'],
      inOrder: ['a', 'b', 'c'],
      postOrder: ['c', 'b', 'a'],
    });
  });

  it('handles nodes with only a left child', () => {
    const tree = n('a', n('b', n('c')));
    expect(renderOrder(tree)).toEqual({
      preOrder: ['a', 'b', 'c'],
      inOrder: ['c', 'b', 'a'],
      postOrder: ['c', 'b', 'a'],
    });
  });

  it('handles a deep left chain of 5000 nodes', () => {
    const result = renderOrder(buildLeftChain(5000));
    expect(result.preOrder).toHaveLength(5000);
    expect(result.preOrder[0]).toBe('c0');
    expect(result.preOrder[4999]).toBe('c4999');
    expect(result.inOrder[0]).toBe('c4999');
    expect(result.inOrder[4999]).toBe('c0');
    expect(result.postOrder[0]).toBe('c4999');
    expect(result.postOrder[4999]).toBe('c0');
  });

  it('handles a deep right chain of 5000 nodes', () => {
    const result = renderOrder(buildRightChain(5000));
    expect(result.preOrder[0]).toBe('c0');
    expect(result.preOrder[4999]).toBe('c4999');
    expect(result.inOrder[0]).toBe('c0');
    expect(result.inOrder[4999]).toBe('c4999');
    expect(result.postOrder[0]).toBe('c4999');
    expect(result.postOrder[4999]).toBe('c0');
  });

  it('handles a wide balanced tree deterministically', () => {
    // perfect tree of depth 3 built by index: node i has children 2i+1, 2i+2
    const nodes: RenderNode[] = [];
    for (let i = 0; i < 15; i++) {
      nodes.push(n(`n${i}`));
    }
    for (let i = 0; i < 7; i++) {
      nodes[i].left = nodes[2 * i + 1];
      nodes[i].right = nodes[2 * i + 2];
    }
    const result = renderOrder(nodes[0]);
    expect(result.preOrder).toHaveLength(15);
    expect(result.preOrder.slice(0, 4)).toEqual(['n0', 'n1', 'n3', 'n7']);
    expect(result.inOrder[0]).toBe('n7');
    expect(result.inOrder[7]).toBe('n0');
    expect(result.postOrder[14]).toBe('n0');
  });
});
