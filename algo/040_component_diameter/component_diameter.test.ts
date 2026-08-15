import { componentDiameter, ComponentNode } from './component_diameter';

const n = (id: string, ...children: ComponentNode[]): ComponentNode => ({
  id,
  children,
});

const buildChain = (length: number, prefix = 'c'): ComponentNode => {
  let node: ComponentNode = n(`${prefix}${length - 1}`);
  for (let i = length - 2; i >= 0; i--) {
    node = { id: `${prefix}${i}`, children: [node] };
  }
  return node;
};

describe('componentDiameter', () => {
  it('measures a path through an internal node', () => {
    const tree = n(
      'app',
      n('a', n('a1', n('a2')), n('b1', n('b2'))),
      n('c'),
    );
    expect(componentDiameter(tree)).toBe(4);
  });

  it('returns 0 for an empty tree', () => {
    expect(componentDiameter(null)).toBe(0);
  });

  it('returns 0 for a single node', () => {
    expect(componentDiameter(n('solo'))).toBe(0);
  });

  it('returns 1 for a root with one child', () => {
    expect(componentDiameter(n('root', n('child')))).toBe(1);
  });

  it('returns 2 for a star (root with many leaf children)', () => {
    const tree = n('hub', n('s1'), n('s2'), n('s3'), n('s4'));
    expect(componentDiameter(tree)).toBe(2);
  });

  it('finds a diameter that does not pass through the root', () => {
    // root has one shallow branch; the long path lives inside 'deep'
    const tree = n(
      'root',
      n('shallow'),
      n('deep', buildChain(10, 'l'), buildChain(12, 'r')),
    );
    // branch heights from 'deep': 10 (via l0) and 12 (via r0) → 10 + 12 = 22
    expect(componentDiameter(tree)).toBe(22);
    // sanity: the best path through 'root' would only be 1 + 13 = 14
  });

  it('combines the two deepest of many children', () => {
    const tree = n(
      'root',
      buildChain(3, 'a'), // depth 3
      buildChain(7, 'b'), // depth 7
      buildChain(5, 'x'), // depth 5
      n('leaf'),
    );
    // two deepest: 7 and 5 → 7 + 5 = 12 edges through root
    expect(componentDiameter(tree)).toBe(12);
  });

  it('is 2 for a wide flat tree regardless of width', () => {
    const children: ComponentNode[] = [];
    for (let i = 0; i < 1000; i++) {
      children.push(n(`child${i}`));
    }
    const tree: ComponentNode = { id: 'root', children };
    expect(componentDiameter(tree)).toBe(2);
  });

  it('is length - 1 for a deep chain of 5000 nodes', () => {
    expect(componentDiameter(buildChain(5000))).toBe(4999);
  });

  it('handles two deep chains hanging off the root', () => {
    const tree = n('root', buildChain(2000, 'p'), buildChain(2500, 'q'));
    expect(componentDiameter(tree)).toBe(4500);
  });

  it('does not double-count a single deepest child', () => {
    // only one child: longest path through root is that child's depth, not 2x
    const tree = n('root', buildChain(4, 'only'));
    expect(componentDiameter(tree)).toBe(4);
  });
});
