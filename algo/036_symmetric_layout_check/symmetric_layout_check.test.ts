import { isSymmetricLayout, LayoutNode } from './symmetric_layout_check';

const n = (type: string, ...children: LayoutNode[]): LayoutNode => ({
  type,
  children,
});

describe('isSymmetricLayout', () => {
  it('accepts a symmetric layout with a middle element', () => {
    const tree = n('row', n('card', n('img')), n('hero'), n('card', n('img')));
    expect(isSymmetricLayout(tree)).toBe(true);
  });

  it('rejects a layout missing one mirrored node', () => {
    const tree = n('row', n('card', n('img')), n('card'));
    expect(isSymmetricLayout(tree)).toBe(false);
  });

  it('accepts an empty tree', () => {
    expect(isSymmetricLayout(null)).toBe(true);
  });

  it('accepts a single node', () => {
    expect(isSymmetricLayout(n('root'))).toBe(true);
  });

  it('rejects mirrored positions with different types', () => {
    const tree = n('row', n('card'), n('banner'));
    expect(isSymmetricLayout(tree)).toBe(false);
  });

  it('requires children to mirror in opposite order, not equal order', () => {
    // left card: [img, text]; right card: [img, text] — same order, NOT mirrored
    const sameOrder = n(
      'row',
      n('card', n('img'), n('text')),
      n('card', n('img'), n('text')),
    );
    expect(isSymmetricLayout(sameOrder)).toBe(false);

    const mirrored = n(
      'row',
      n('card', n('img'), n('text')),
      n('card', n('text'), n('img')),
    );
    expect(isSymmetricLayout(mirrored)).toBe(true);
  });

  it('rejects when an odd middle child is not self-symmetric', () => {
    const tree = n(
      'row',
      n('card'),
      n('mid', n('a'), n('b')), // middle child must mirror itself
      n('card'),
    );
    expect(isSymmetricLayout(tree)).toBe(false);
  });

  it('accepts when the odd middle child is self-symmetric', () => {
    const tree = n(
      'row',
      n('card'),
      n('mid', n('a'), n('center'), n('a')),
      n('card'),
    );
    expect(isSymmetricLayout(tree)).toBe(true);
  });

  it('detects an asymmetry buried three levels deep', () => {
    const tree = n(
      'root',
      n('col', n('box', n('icon'))),
      n('col', n('box', n('icn'))),
    );
    expect(isSymmetricLayout(tree)).toBe(false);
  });

  it('rejects mirrored nodes with different child counts', () => {
    const tree = n('row', n('card', n('a'), n('b')), n('card', n('b')));
    expect(isSymmetricLayout(tree)).toBe(false);
  });

  it('handles a wide flat palindrome of types', () => {
    const types = ['a', 'b', 'c', 'd', 'c', 'b', 'a'];
    const tree: LayoutNode = { type: 'root', children: types.map((t) => n(t)) };
    expect(isSymmetricLayout(tree)).toBe(true);

    const broken: LayoutNode = {
      type: 'root',
      children: ['a', 'b', 'c', 'd', 'c', 'x', 'a'].map((t) => n(t)),
    };
    expect(isSymmetricLayout(broken)).toBe(false);
  });

  it('handles a deep single-child chain of 5000 nodes', () => {
    let node: LayoutNode = n('leaf');
    for (let i = 0; i < 4999; i++) {
      node = { type: 'wrap', children: [node] };
    }
    // a single-child chain mirrors onto itself
    expect(isSymmetricLayout(node)).toBe(true);
  });

  it('handles two deep mirrored branches with a mismatch at the bottom', () => {
    const buildBranch = (depth: number, leafType: string): LayoutNode => {
      let node: LayoutNode = n(leafType);
      for (let i = 0; i < depth; i++) {
        node = { type: 'wrap', children: [node] };
      }
      return node;
    };
    const good = n(
      'root',
      buildBranch(2000, 'leaf'),
      buildBranch(2000, 'leaf'),
    );
    expect(isSymmetricLayout(good)).toBe(true);

    const bad = n('root', buildBranch(2000, 'leaf'), buildBranch(2000, 'feal'));
    expect(isSymmetricLayout(bad)).toBe(false);
  });
});
