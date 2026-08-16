import { folderSizes, FsNode } from './folder_sizes';

const file = (name: string, size: number): FsNode => ({
  name,
  kind: 'file',
  size,
  children: [],
});

const folder = (name: string, ...children: FsNode[]): FsNode => ({
  name,
  kind: 'folder',
  children,
});

describe('folderSizes', () => {
  it('aggregates sizes for a small project tree', () => {
    const tree = folder(
      'project',
      folder('src', file('index.ts', 100), file('util.ts', 50)),
      file('readme.md', 10),
      folder('empty'),
    );
    const sizes = folderSizes(tree);
    expect(sizes.get('project')).toBe(160);
    expect(sizes.get('project/src')).toBe(150);
    expect(sizes.get('project/empty')).toBe(0);
    expect(sizes.size).toBe(3);
  });

  it('handles a root folder with no children', () => {
    const sizes = folderSizes(folder('root'));
    expect(sizes.get('root')).toBe(0);
    expect(sizes.size).toBe(1);
  });

  it('throws if the root is a file', () => {
    expect(() => folderSizes(file('orphan.txt', 5))).toThrow();
  });

  it('does not include file paths as keys', () => {
    const tree = folder(
      'root',
      file('a.txt', 1),
      folder('sub', file('b.txt', 2)),
    );
    const sizes = folderSizes(tree);
    expect(sizes.has('root/a.txt')).toBe(false);
    expect(sizes.has('root/sub/b.txt')).toBe(false);
    expect(sizes.get('root')).toBe(3);
    expect(sizes.get('root/sub')).toBe(2);
  });

  it('handles folders containing only folders', () => {
    const tree = folder('a', folder('b', folder('c', file('leaf.bin', 7))));
    const sizes = folderSizes(tree);
    expect(sizes.get('a')).toBe(7);
    expect(sizes.get('a/b')).toBe(7);
    expect(sizes.get('a/b/c')).toBe(7);
  });

  it('distinguishes same-named folders at different paths', () => {
    const tree = folder(
      'root',
      folder('src', folder('lib', file('x.ts', 10))),
      folder('vendor', folder('lib', file('y.ts', 20))),
    );
    const sizes = folderSizes(tree);
    expect(sizes.get('root/src/lib')).toBe(10);
    expect(sizes.get('root/vendor/lib')).toBe(20);
    expect(sizes.get('root')).toBe(30);
  });

  it('counts zero-byte files without changing totals', () => {
    const tree = folder('root', file('empty.log', 0), file('data.log', 42));
    expect(folderSizes(tree).get('root')).toBe(42);
  });

  it('handles a wide flat folder of 1000 files', () => {
    const children: FsNode[] = [];
    for (let i = 0; i < 1000; i++) {
      children.push(file(`f${i}.dat`, 2));
    }
    const tree: FsNode = { name: 'big', kind: 'folder', children };
    const sizes = folderSizes(tree);
    expect(sizes.get('big')).toBe(2000);
    expect(sizes.size).toBe(1);
  });

  it('handles a deep chain of 5000 nested folders', () => {
    let node: FsNode = folder('d4999', file('leaf.bin', 3));
    for (let i = 4998; i >= 0; i--) {
      node = folder(`d${i}`, node);
    }
    const sizes = folderSizes(node);
    expect(sizes.size).toBe(5000);
    expect(sizes.get('d0')).toBe(3);
    const midPath = Array.from({ length: 2501 }, (_, i) => `d${i}`).join('/');
    expect(sizes.get(midPath)).toBe(3);
  });
});
