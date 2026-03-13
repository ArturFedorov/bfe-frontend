export interface DOMNode {
  tag: string;
  attrs?: Record<string, string>;
  children?: (DOMNode | string)[];
}

export function serialize(node: DOMNode): string {
  return "";
}

export function deserialize(json: string): DOMNode {
  return { tag: "" };
}
