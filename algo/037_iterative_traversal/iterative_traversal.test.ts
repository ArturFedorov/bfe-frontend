import {
  preOrderIterative,
  inOrderIterative,
  postOrderIterative,
  RenderNode,
} from './iterative_traversal';

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

const buildZigzag = (length: number): RenderNode => {
  let node = n(`c${length - 1}`);
  for (let i = length - 2; i >= 0; i--) {
    node = i % 2 === 0 ? n(`c${i}`, node, null) : n(`c${i}`, null, node);
  }
  return node;
};

describe('iterative traversals', () => {
  const small = n('root', n('a', null, n('b')), n('c'));

  describe('preOrderIterative', () => {
    it('traverses a small tree', () => {
      expect(preOrderIterative(small)).toEqual(['root', 'a', 'b', 'c']);
    });

    it('returns [] for an empty tree', () => {
      expect(preOrderIterative(null)).toEqual([]);
    });

    it('handles a single node', () => {
      expect(preOrderIterative(n('solo'))).toEqual(['solo']);
    });

    it('survives a 100k-deep left chain (recursion would overflow)', () => {
      const result = preOrderIterative(buildLeftChain(100_000));
      expect(result).toHaveLength(100_000);
      expect(result[0]).toBe('c0');
      expect(result[99_999]).toBe('c99999');
    });

    it('survives a 100k-deep right chain', () => {
      const result = preOrderIterative(buildRightChain(100_000));
      expect(result[0]).toBe('c0');
      expect(result[99_999]).toBe('c99999');
    });
  });

  describe('inOrderIterative', () => {
    it('traverses a small tree', () => {
      expect(inOrderIterative(small)).toEqual(['a', 'b', 'root', 'c']);
    });

    it('returns [] for an empty tree', () => {
      expect(inOrderIterative(null)).toEqual([]);
    });

    it('handles a single node', () => {
      expect(inOrderIterative(n('solo'))).toEqual(['solo']);
    });

    it('handles right-only nodes correctly', () => {
      const tree = n('a', null, n('b', null, n('c')));
      expect(inOrderIterative(tree)).toEqual(['a', 'b', 'c']);
    });

    it('survives a 100k-deep left chain (recursion would overflow)', () => {
      const result = inOrderIterative(buildLeftChain(100_000));
      expect(result).toHaveLength(100_000);
      expect(result[0]).toBe('c99999');
      expect(result[99_999]).toBe('c0');
    });

    it('survives a 100k-deep zigzag chain', () => {
      const result = inOrderIterative(buildZigzag(100_000));
      expect(result).toHaveLength(100_000);
      expect(new Set(result).size).toBe(100_000);
    });
  });

  describe('postOrderIterative', () => {
    it('traverses a small tree', () => {
      expect(postOrderIterative(small)).toEqual(['b', 'a', 'c', 'root']);
    });

    it('returns [] for an empty tree', () => {
      expect(postOrderIterative(null)).toEqual([]);
    });

    it('handles a single node', () => {
      expect(postOrderIterative(n('solo'))).toEqual(['solo']);
    });

    it('visits every node after both its children', () => {
      const tree = n(
        'f',
        n('b', n('a'), n('d', n('c'), n('e'))),
        n('g', null, n('i', n('h'))),
      );
      expect(postOrderIterative(tree)).toEqual([
        'a',
        'c',
        'e',
        'd',
        'b',
        'h',
        'i',
        'g',
        'f',
      ]);
    });

    it('survives a 100k-deep left chain (recursion would overflow)', () => {
      const result = postOrderIterative(buildLeftChain(100_000));
      expect(result).toHaveLength(100_000);
      expect(result[0]).toBe('c99999');
      expect(result[99_999]).toBe('c0');
    });

    it('survives a 100k-deep right chain', () => {
      const result = postOrderIterative(buildRightChain(100_000));
      expect(result[0]).toBe('c99999');
      expect(result[99_999]).toBe('c0');
    });
  });

  describe('cross-order consistency', () => {
    it('all three orders agree on the node set of a balanced tree', () => {
      const nodes: RenderNode[] = [];
      for (let i = 0; i < 31; i++) {
        nodes.push(n(`n${i}`));
      }
      for (let i = 0; i < 15; i++) {
        nodes[i].left = nodes[2 * i + 1];
        nodes[i].right = nodes[2 * i + 2];
      }
      const pre = preOrderIterative(nodes[0]);
      const ino = inOrderIterative(nodes[0]);
      const post = postOrderIterative(nodes[0]);
      expect(pre).toHaveLength(31);
      expect([...pre].sort()).toEqual([...ino].sort());
      expect([...ino].sort()).toEqual([...post].sort());
      expect(pre[0]).toBe('n0');
      expect(post[30]).toBe('n0');
      expect(ino[15]).toBe('n0');
    });
  });
});
