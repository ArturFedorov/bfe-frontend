export interface ComponentNode {
  id: string;
  type?: string;
  children: ComponentNode[];
}

export function commonContainer(
  root: ComponentNode,
  idA: string,
  idB: string,
): string {
  let answer: string | null = null;

  const visit = (node: ComponentNode): number => {
    let count = 0;

    if (node.id === idA) count += 1;
    if (node.id === idB) count += 1;

    for (const child of node.children) {
      count += visit(child);
    }

    if (count >= 2 && answer === null) {
      answer = node.id;
    }

    return count;
  };

  visit(root);

  if (answer === null) {
    throw new Error('Unable to determine node id for node id');
  }

  return answer;
}
