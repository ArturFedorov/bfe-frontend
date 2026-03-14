import { serialize, deserialize, DOMNode } from './serializeDomTree';

describe('serialize', () => {
  it('should serialize a simple element', () => {
    const node: DOMNode = { tag: 'div' };
    const json = serialize(node);
    expect(JSON.parse(json)).toEqual({ tag: 'div' });
  });

  it('should serialize element with attributes', () => {
    const node: DOMNode = { tag: 'div', attrs: { class: 'main', id: 'root' } };
    const json = serialize(node);
    const parsed = JSON.parse(json);
    expect(parsed.tag).toBe('div');
    expect(parsed.attrs).toEqual({ class: 'main', id: 'root' });
  });

  it('should serialize element with children', () => {
    const node: DOMNode = {
      tag: 'div',
      children: [{ tag: 'p' }, { tag: 'span' }],
    };
    const json = serialize(node);
    const parsed = JSON.parse(json);
    expect(parsed.children).toHaveLength(2);
  });

  it('should serialize text nodes', () => {
    const node: DOMNode = {
      tag: 'p',
      children: ['Hello World'],
    };
    const json = serialize(node);
    const parsed = JSON.parse(json);
    expect(parsed.children).toEqual(['Hello World']);
  });

  it('should serialize nested structure', () => {
    const node: DOMNode = {
      tag: 'div',
      children: [
        {
          tag: 'ul',
          children: [
            { tag: 'li', children: ['Item 1'] },
            { tag: 'li', children: ['Item 2'] },
          ],
        },
      ],
    };
    const json = serialize(node);
    const parsed = JSON.parse(json);
    expect(parsed.children[0].tag).toBe('ul');
    expect(parsed.children[0].children).toHaveLength(2);
  });
});

describe('deserialize', () => {
  it('should deserialize a simple element', () => {
    const json = JSON.stringify({ tag: 'div' });
    const node = deserialize(json);
    expect(node.tag).toBe('div');
  });

  it('should deserialize element with attributes', () => {
    const json = JSON.stringify({ tag: 'div', attrs: { id: 'test' } });
    const node = deserialize(json);
    expect(node.attrs).toEqual({ id: 'test' });
  });
});

describe('roundtrip', () => {
  it('should produce equivalent structure after serialize then deserialize', () => {
    const original: DOMNode = {
      tag: 'div',
      attrs: { class: 'container' },
      children: [
        { tag: 'h1', children: ['Title'] },
        {
          tag: 'p',
          attrs: { id: 'content' },
          children: ['Some text'],
        },
      ],
    };

    const result = deserialize(serialize(original));
    expect(result).toEqual(original);
  });
});
