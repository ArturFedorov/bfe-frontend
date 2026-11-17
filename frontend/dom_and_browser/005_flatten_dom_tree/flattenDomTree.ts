export interface TreeNode {
  value: any;
  children: TreeNode[];
}

export function flattenDFS(root: TreeNode): any[] {
  const results: any[] = [];

  const visit = (node: TreeNode) => {
    results.push(node.value);
    for (const child of node.children) visit(child);
  };

  visit(root);
  return results;
}

export function flattenBFS(root: TreeNode): any[] {
  const results: any[] = [];
  const queue: TreeNode[] = [root];
  let head = 0;

  while (head < queue.length) {
    const node = queue[head++];
    results.push(node.value);

    for (const child of node.children) queue.push(child);
  }

  return results;
}
