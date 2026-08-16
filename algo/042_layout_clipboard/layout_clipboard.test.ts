import { serialize, deserialize, LayoutNode } from './layout_clipboard';

const n = (
  id: string,
  children: LayoutNode[] = [],
  text?: string,
): LayoutNode =>
  text === undefined ? { id, children } : { id, text, children };

const roundTrip = (tree: LayoutNode | null): LayoutNode | null =>
  deserialize(serialize(tree));

describe('layout clipboard', () => {
  it('round-trips a small tree exactly', () => {
    const tree = n('root', [
      n('title', [], 'Hello, world'),
      n('box', [n('leaf', [], 'payload')]),
    ]);
    expect(roundTrip(tree)).toEqual(tree);
  });

  it('serializes to a string', () => {
    expect(typeof serialize(n('root'))).toBe('string');
    expect(typeof serialize(null)).toBe('string');
  });

  it('round-trips null', () => {
    expect(roundTrip(null)).toBeNull();
  });

  it('round-trips a single node without text', () => {
    const tree = n('solo');
    const result = roundTrip(tree);
    expect(result).toEqual(tree);
    expect(result!.children).toEqual([]);
  });

  it('round-trips empty-string text as empty string, not absent', () => {
    const tree = n('node', [], '');
    const result = roundTrip(tree);
    expect(result!.text).toBe('');
    expect(typeof result!.text).toBe('string');
  });

  it('round-trips an empty-string id', () => {
    const tree = n('', [n('child')]);
    expect(roundTrip(tree)).toEqual(tree);
  });

  describe('delimiter-hostile content', () => {
    it.each([
      ['commas', 'a,b,,c'],
      ['pipes', 'a|b||c'],
      ['brackets and braces', '[{(a)}]'],
      ['quotes', `it's "quoted" \`here\``],
      ['backslashes', 'C:\\\\path\\to\\file'],
      ['newlines and tabs', 'line1\nline2\tend'],
      ['semicolons and colons', 'a:b;c::d'],
      ['hashes and nulls', 'a#b\u0000c'],
      ['unicode and emoji', 'café 日本語 🎉'],
      ['digits that look like counts', '3[2]{1}'],
    ])('round-trips ids and text containing %s', (_label, evil) => {
      const tree = n(evil, [n(`child-${evil}`, [], evil)], evil);
      expect(roundTrip(tree)).toEqual(tree);
    });

    it('survives text that looks like the serialized format itself', () => {
      const inner = n('inner', [], 'x');
      const probe = serialize(n('decoy', [inner], 'd'));
      // embed a full serialization as a text payload
      const tree = n('outer', [n('victim', [], probe)]);
      expect(roundTrip(tree)).toEqual(tree);
    });
  });

  it('round-trips a tree where sibling ids collide', () => {
    const tree = n('root', [n('same'), n('same'), n('same', [], 'x')]);
    expect(roundTrip(tree)).toEqual(tree);
  });

  it('preserves child order', () => {
    const tree = n('root', [n('c'), n('a'), n('b')]);
    const result = roundTrip(tree)!;
    expect(result.children.map((c) => c.id)).toEqual(['c', 'a', 'b']);
  });

  it('is deterministic: same tree, same string', () => {
    const build = (): LayoutNode =>
      n('root', [n('a', [], 'x'), n('b', [n('c')])]);
    expect(serialize(build())).toBe(serialize(build()));
  });

  it('is stable under double round-trip', () => {
    const tree = n('root', [n('a', [], 'x,y|z'), n('b')]);
    const once = serialize(tree);
    expect(serialize(deserialize(once))).toBe(once);
  });

  it('round-trips a wide flat tree of 1000 children', () => {
    const children: LayoutNode[] = [];
    for (let i = 0; i < 1000; i++) {
      children.push(n(`child${i}`, [], i % 3 === 0 ? `t${i}` : undefined));
    }
    const tree: LayoutNode = { id: 'root', children };
    expect(roundTrip(tree)).toEqual(tree);
  });

  it('round-trips a deep chain of 5000 nodes', () => {
    let node: LayoutNode = n('c4999', [], 'bottom');
    for (let i = 4998; i >= 0; i--) {
      node = { id: `c${i}`, children: [node] };
    }
    const result = roundTrip(node);
    expect(result!.id).toBe('c0');
    let cursor: LayoutNode = result!;
    let depth = 1;
    while (cursor.children.length > 0) {
      cursor = cursor.children[0];
      depth += 1;
    }
    expect(depth).toBe(5000);
    expect(cursor.id).toBe('c4999');
    expect(cursor.text).toBe('bottom');
  });
});
