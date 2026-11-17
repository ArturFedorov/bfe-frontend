export class DOMTree {
  tag: string;
  children: DOMTree[];
  parent: DOMTree | null;

  constructor(tag: string) {
    this.tag = tag;
    this.children = [];
    this.parent = null;
  }

  appendChild(child: DOMTree): DOMTree {
    if (child.parent) child.parent.removeChild(child);
    this.children.push(child);
    child.parent = this;

    return child;
  }

  removeChild(child: DOMTree): DOMTree {
    const index = this.children.indexOf(child);

    if (index === -1) {
      throw new Error(
        `removeChild: <${child.tag}> is not a child of <${this.tag}>`,
      );
    }

    this.children.splice(index, 1);
    child.parent = null;

    return child;
  }

  querySelector(tag: string): DOMTree | null {
    for (const child of this.children) {
      if (child.tag === tag) return child;
      const found = child.querySelector(tag);
      if (found) return found;
    }

    return null;
  }

  querySelectorAll(tag: string): DOMTree[] {
    const matched: DOMTree[] = [];

    for (const child of this.children) {
      if (child.tag === tag) matched.push(child);
      matched.push(...child.querySelectorAll(tag));
    }

    return matched;
  }
}
