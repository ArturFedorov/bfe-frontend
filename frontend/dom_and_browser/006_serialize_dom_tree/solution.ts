/**
 * Reference solution for 006 — serialize / deserialize a DOM-like tree.
 *
 * The tree is already plain data (strings, objects, arrays), so JSON is a
 * natural wire format and `JSON.stringify`/`JSON.parse` are exact inverses for
 * it. The work is in the edges:
 *  - serialize must emit ONLY the DOMNode shape (optional fields omitted when
 *    undefined, so the roundtrip is deep-equal to the input);
 *  - deserialize must validate that what came off the wire really is a tree,
 *    instead of blindly trusting `JSON.parse`'s `any`.
 */
export interface DOMNode {
  tag: string;
  attrs?: Record<string, string>;
  children?: (DOMNode | string)[];
}

/** Rebuild a node with only the known fields, dropping undefined optionals. */
function toPlain(node: DOMNode): DOMNode {
  const out: DOMNode = { tag: node.tag };
  if (node.attrs !== undefined) out.attrs = { ...node.attrs };
  if (node.children !== undefined) {
    out.children = node.children.map((child) =>
      typeof child === 'string' ? child : toPlain(child),
    );
  }
  return out;
}

export function serialize(node: DOMNode): string {
  return JSON.stringify(toPlain(node));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Validate an arbitrary parsed value as a DOMNode (recursively). */
function toDOMNode(value: unknown, path: string): DOMNode {
  if (!isRecord(value)) throw new TypeError(`${path}: expected an object`);
  if (typeof value.tag !== 'string' || value.tag === '') {
    throw new TypeError(`${path}.tag: expected a non-empty string`);
  }

  const node: DOMNode = { tag: value.tag };

  if (value.attrs !== undefined) {
    if (!isRecord(value.attrs))
      throw new TypeError(`${path}.attrs: expected an object`);
    const attrs: Record<string, string> = {};
    for (const [key, attr] of Object.entries(value.attrs)) {
      if (typeof attr !== 'string') {
        throw new TypeError(`${path}.attrs.${key}: expected a string`);
      }
      attrs[key] = attr;
    }
    node.attrs = attrs;
  }

  if (value.children !== undefined) {
    if (!Array.isArray(value.children)) {
      throw new TypeError(`${path}.children: expected an array`);
    }
    node.children = value.children.map((child, i) =>
      typeof child === 'string'
        ? child
        : toDOMNode(child, `${path}.children[${i}]`),
    );
  }

  return node;
}

export function deserialize(json: string): DOMNode {
  return toDOMNode(JSON.parse(json), 'root');
}
