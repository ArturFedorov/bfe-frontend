import { componentDepth, ComponentNode } from './component_depth';

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

describe('componentDepth', () => {
  it('computes depth of a small mixed tree', () => {
    const tree = n(
      'app',
      n('header'),
      n('main', n('article', n('p1'))),
    );
    expect(componentDepth(tree)).toBe(4);
  });

  it('returns 1 for a single node', () => {
    expect(componentDepth(n('solo'))).toBe(1);
  });

  it('returns 0 for an empty tree', () => {
    expect(componentDepth(null)).toBe(0);
  });

  it('returns 2 for a root with only direct children', () => {
    const tree = n('root', n('a'), n('b'), n('c'));
    expect(componentDepth(tree)).toBe(2);
  });

  it('finds the deepest branch among shallower siblings', () => {
    const tree = n(
      'root',
      n('shallow'),
      n('mid', n('leaf1')),
      n('deep', n('deeper', n('deepest', n('bottom')))),
      n('shallow2'),
    );
    expect(componentDepth(tree)).toBe(5);
  });

  it('depth does not depend on child order', () => {
    const left = n('root', n('deep', n('deeper', n('deepest'))), n('flat'));
    const right = n('root', n('flat'), n('deep', n('deeper', n('deepest'))));
    expect(componentDepth(left)).toBe(4);
    expect(componentDepth(right)).toBe(4);
  });

  it('handles a wide flat tree', () => {
    const children: ComponentNode[] = [];
    for (let i = 0; i < 1000; i++) {
      children.push(n(`child${i}`));
    }
    const tree: ComponentNode = { id: 'root', children };
    expect(componentDepth(tree)).toBe(2);
  });

  it('handles a deep unbalanced chain of 5000 nodes', () => {
    expect(componentDepth(buildChain(5000))).toBe(5000);
  });

  it('handles a chain with a wide fan-out at the bottom', () => {
    const chain = buildChain(100);
    let cursor = chain;
    while (cursor.children.length > 0) {
      cursor = cursor.children[0];
    }
    for (let i = 0; i < 50; i++) {
      cursor.children.push(n(`fan${i}`));
    }
    expect(componentDepth(chain)).toBe(101);
  });
});
