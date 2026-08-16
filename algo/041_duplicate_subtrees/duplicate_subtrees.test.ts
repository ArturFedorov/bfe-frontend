import { duplicateSubtrees, ComponentNode } from './duplicate_subtrees';

const n = (
  id: string,
  type: string,
  ...children: ComponentNode[]
): ComponentNode => ({ id, type, children });

const btn = (id: string): ComponentNode => n(id, 'button');

describe('duplicateSubtrees', () => {
  it('groups identical subtrees and their identical descendants', () => {
    const tree = n(
      'root',
      'page',
      n('cardA', 'card', btn('b1')),
      n('cardB', 'card', btn('b2')),
      btn('b3'),
    );
    expect(duplicateSubtrees(tree)).toEqual([
      ['cardA', 'cardB'],
      ['b1', 'b2', 'b3'],
    ]);
  });

  it('returns [] when there are no duplicates', () => {
    const tree = n(
      'root',
      'page',
      n('a', 'header'),
      n('b', 'footer', n('c', 'link')),
    );
    expect(duplicateSubtrees(tree)).toEqual([]);
  });

  it('returns [] for an empty tree', () => {
    expect(duplicateSubtrees(null)).toEqual([]);
  });

  it('returns [] for a single node', () => {
    expect(duplicateSubtrees(n('solo', 'div'))).toEqual([]);
  });

  it('does not group same-type nodes with different child structure', () => {
    const tree = n(
      'root',
      'page',
      n('a', 'card', btn('x')),
      n('b', 'card', btn('y'), btn('z')), // same type, different child count
    );
    // 'a' and 'b' differ; only the three buttons match
    expect(duplicateSubtrees(tree)).toEqual([['x', 'y', 'z']]);
  });

  it('respects child order when comparing structure', () => {
    const tree = n(
      'root',
      'page',
      n('a', 'card', n('a1', 'img'), n('a2', 'text')),
      n('b', 'card', n('b1', 'text'), n('b2', 'img')), // reversed children
    );
    expect(duplicateSubtrees(tree)).toEqual([
      ['a1', 'b2'], // img leaves
      ['a2', 'b1'], // text leaves
    ]);
  });

  it('finds duplicates at different depths', () => {
    const tree = n(
      'root',
      'page',
      n('shallow', 'widget', btn('s1')),
      n(
        'wrapper',
        'section',
        n('inner', 'box', n('deep', 'widget', btn('d1'))),
      ),
    );
    expect(duplicateSubtrees(tree)).toEqual([
      ['shallow', 'deep'],
      ['s1', 'd1'],
    ]);
  });

  it('orders ids within a group by pre-order encounter', () => {
    const tree = n(
      'root',
      'page',
      n('z-late', 'chip'),
      n('mid', 'row', n('a-early', 'chip')),
      n('b-last', 'chip'),
    );
    // pre-order: root, z-late, mid, a-early, b-last
    expect(duplicateSubtrees(tree)).toEqual([['z-late', 'a-early', 'b-last']]);
  });

  it('handles a wide flat tree of identical leaves', () => {
    const children: ComponentNode[] = [];
    const expectedGroup: string[] = [];
    for (let i = 0; i < 1000; i++) {
      children.push(n(`leaf${i}`, 'item'));
      expectedGroup.push(`leaf${i}`);
    }
    const tree: ComponentNode = { id: 'root', type: 'list', children };
    expect(duplicateSubtrees(tree)).toEqual([expectedGroup]);
  });

  it('returns [] for a deep uniform chain (same type is not enough)', () => {
    let node: ComponentNode = n('c4999', 'wrap');
    for (let i = 4998; i >= 0; i--) {
      node = { id: `c${i}`, type: 'wrap', children: [node] };
    }
    // every subtree has a different height, so no two are identical
    expect(duplicateSubtrees(node)).toEqual([]);
  });

  it('pairs up two identical deep chains level by level', () => {
    const buildChain = (length: number, prefix: string): ComponentNode => {
      let node: ComponentNode = n(`${prefix}${length - 1}`, 'wrap');
      for (let i = length - 2; i >= 0; i--) {
        node = { id: `${prefix}${i}`, type: 'wrap', children: [node] };
      }
      return node;
    };
    const tree = n(
      'root',
      'page',
      buildChain(2000, 'p'),
      buildChain(2000, 'q'),
    );
    const groups = duplicateSubtrees(tree);
    expect(groups).toHaveLength(2000);
    expect(groups[0]).toEqual(['p0', 'q0']);
    expect(groups[1]).toEqual(['p1', 'q1']);
    expect(groups[1999]).toEqual(['p1999', 'q1999']);
  });

  it('reports a group only once even with three copies', () => {
    const copy = (suffix: string): ComponentNode =>
      n(
        `hero${suffix}`,
        'hero',
        n(`img${suffix}`, 'img'),
        n(`cta${suffix}`, 'button'),
      );
    const tree = n('root', 'page', copy('A'), copy('B'), copy('C'));
    expect(duplicateSubtrees(tree)).toEqual([
      ['heroA', 'heroB', 'heroC'],
      ['imgA', 'imgB', 'imgC'],
      ['ctaA', 'ctaB', 'ctaC'],
    ]);
  });
});
