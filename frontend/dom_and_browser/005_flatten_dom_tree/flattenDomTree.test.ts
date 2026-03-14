import { flattenDFS, flattenBFS, TreeNode } from './flattenDomTree';

function node(value: any, children: TreeNode[] = []): TreeNode {
  return { value, children };
}

describe('flattenDFS', () => {
  it('should return correct DFS order', () => {
    const tree = node(1, [node(2, [node(4)]), node(3)]);
    expect(flattenDFS(tree)).toEqual([1, 2, 4, 3]);
  });

  it('should handle a single node', () => {
    expect(flattenDFS(node('a'))).toEqual(['a']);
  });

  it('should handle deep nesting', () => {
    const tree = node(1, [node(2, [node(3, [node(4)])])]);
    expect(flattenDFS(tree)).toEqual([1, 2, 3, 4]);
  });

  it('should handle wide tree', () => {
    const tree = node(1, [node(2), node(3), node(4), node(5)]);
    expect(flattenDFS(tree)).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('flattenBFS', () => {
  it('should return correct BFS order', () => {
    const tree = node(1, [node(2, [node(4)]), node(3)]);
    expect(flattenBFS(tree)).toEqual([1, 2, 3, 4]);
  });

  it('should handle a single node', () => {
    expect(flattenBFS(node('a'))).toEqual(['a']);
  });

  it('should handle deep nesting', () => {
    const tree = node(1, [node(2, [node(3, [node(4)])])]);
    expect(flattenBFS(tree)).toEqual([1, 2, 3, 4]);
  });

  it('should handle wide tree', () => {
    const tree = node(1, [node(2), node(3), node(4), node(5)]);
    expect(flattenBFS(tree)).toEqual([1, 2, 3, 4, 5]);
  });
});
