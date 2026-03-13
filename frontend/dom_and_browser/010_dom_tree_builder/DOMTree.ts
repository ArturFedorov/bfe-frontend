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
    return child;
  }

  removeChild(child: DOMTree): DOMTree {
    return child;
  }

  querySelector(tag: string): DOMTree | null {
    return null;
  }

  querySelectorAll(tag: string): DOMTree[] {
    return [];
  }
}
