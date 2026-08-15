# 035. Folder Sizes

**Difficulty:** Easy
**Topics:** Trees, Post-order Aggregation, File Systems

---

## Description

A disk-usage panel needs the total size of every folder in a project. You are
given the root of a file tree where every node is either a `file` (has a
`size` in bytes, no children) or a `folder` (has `children`, no own size). A
folder's total size is the sum of every file anywhere beneath it. Return a
`Map` from each folder's full path to its total size — the path is the node
names from the root down, joined with `/` (the root folder's path is just its
name). This is a classic post-order aggregation: a folder's answer is built
from its children's answers.

## Examples

```ts
const tree = {
  name: 'project', kind: 'folder', children: [
    { name: 'src', kind: 'folder', children: [
      { name: 'index.ts', kind: 'file', size: 100, children: [] },
      { name: 'util.ts', kind: 'file', size: 50, children: [] },
    ] },
    { name: 'readme.md', kind: 'file', size: 10, children: [] },
    { name: 'empty', kind: 'folder', children: [] },
  ],
};

folderSizes(tree);
// Map {
//   'project'       => 160,
//   'project/src'   => 150,
//   'project/empty' => 0,
// }
```

## Constraints

- `1 <= number of nodes <= 100_000`.
- The root is always a folder — throw if it is a file.
- Sibling names are unique (like a real filesystem), so every path is unique.
  Non-sibling nodes may share names.
- Files always have a non-negative integer `size`; folders never have `size`.
- An empty folder has total size `0`.
- Only folders appear as keys in the result — files do not.

## Target

O(n) time, single post-order traversal — no re-walking subtrees per folder.

## Interviewer follow-up

The tree no longer fits in memory — you receive it as a stream of
`(path, fileSize)` entries in arbitrary order. How do you produce the same
per-folder totals?
