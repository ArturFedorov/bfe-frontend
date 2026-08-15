import { commonContainer, ComponentNode } from './common_container';

const n = (id: string, ...children: ComponentNode[]): ComponentNode => ({
  id,
  children,
});

const page = n(
  'page',
  n('nav', n('logo')),
  n(
    'main',
    n('card', n('title'), n('button')),
    n('aside', n('widget', n('widgetLabel'))),
  ),
  n('footer'),
);

const buildChain = (length: number): ComponentNode => {
  let node: ComponentNode = n(`c${length - 1}`);
  for (let i = length - 2; i >= 0; i--) {
    node = { id: `c${i}`, children: [node] };
  }
  return node;
};

describe('commonContainer', () => {
  it('finds the parent of two siblings', () => {
    expect(commonContainer(page, 'title', 'button')).toBe('card');
  });

  it('finds the root for nodes in different top-level branches', () => {
    expect(commonContainer(page, 'logo', 'aside')).toBe('page');
  });

  it('returns the ancestor when one node contains the other', () => {
    expect(commonContainer(page, 'main', 'button')).toBe('main');
    expect(commonContainer(page, 'widgetLabel', 'aside')).toBe('aside');
  });

  it('returns the node itself when both ids are equal', () => {
    expect(commonContainer(page, 'card', 'card')).toBe('card');
    expect(commonContainer(page, 'page', 'page')).toBe('page');
  });

  it('returns the root when one id is the root', () => {
    expect(commonContainer(page, 'page', 'widgetLabel')).toBe('page');
  });

  it('is symmetric in its arguments', () => {
    expect(commonContainer(page, 'title', 'widget')).toBe('main');
    expect(commonContainer(page, 'widget', 'title')).toBe('main');
  });

  it('handles a single-node tree', () => {
    expect(commonContainer(n('solo'), 'solo', 'solo')).toBe('solo');
  });

  it('throws when the first id is missing', () => {
    expect(() => commonContainer(page, 'ghost', 'button')).toThrow();
  });

  it('throws when the second id is missing', () => {
    expect(() => commonContainer(page, 'button', 'ghost')).toThrow();
  });

  it('throws when both ids are missing', () => {
    expect(() => commonContainer(page, 'ghost1', 'ghost2')).toThrow();
  });

  it('finds deep answers in a wide flat tree', () => {
    const children: ComponentNode[] = [];
    for (let i = 0; i < 1000; i++) {
      children.push(n(`w${i}`, n(`w${i}-leaf`)));
    }
    const wide: ComponentNode = { id: 'root', children };
    expect(commonContainer(wide, 'w3-leaf', 'w997-leaf')).toBe('root');
    expect(commonContainer(wide, 'w500', 'w500-leaf')).toBe('w500');
  });

  it('handles a deep chain of 5000 nodes', () => {
    const chain = buildChain(5000);
    expect(commonContainer(chain, 'c4999', 'c100')).toBe('c100');
    expect(commonContainer(chain, 'c2500', 'c2501')).toBe('c2500');
  });

  it('handles two deep branches joined near the root', () => {
    const left = buildChain(2000);
    const right = { id: 'r0', children: [buildChain(1999)] };
    // rename right chain ids to avoid collisions
    let cursor: ComponentNode | undefined = right.children[0];
    let i = 1;
    while (cursor) {
      cursor.id = `r${i}`;
      i += 1;
      cursor = cursor.children[0];
    }
    const root = n('root', left, right);
    expect(commonContainer(root, 'c1999', 'r1999')).toBe('root');
  });
});
