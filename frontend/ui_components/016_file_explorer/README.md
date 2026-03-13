# 16. File Explorer

**Difficulty:** Hard  
**Topics:** DOM manipulation, tree data structures, recursive rendering, event handling

---

## Description

Build a file explorer (tree view) component that renders a hierarchical file/folder structure. Folders can be expanded or collapsed to show/hide their children. Clicking a file or folder selects it.

## Requirements

- Render a nested tree structure from the provided `data` array
- Files are leaf nodes; folders can contain children
- Clicking a folder toggles its expanded/collapsed state
- Clicking any node (file or folder) selects it and applies an `active` class
- The `onSelect` callback fires with the selected node when a node is clicked
- `getSelected()` returns the currently selected node, or `null` if none
- Nested folders render recursively with appropriate indentation
- `destroy()` removes all listeners and cleans up the DOM

## Examples

```ts
const container = document.getElementById('explorer')!;

const explorer = createFileExplorer({
  container,
  data: [
    {
      name: 'src',
      type: 'folder',
      children: [
        { name: 'index.ts', type: 'file' },
        { name: 'utils', type: 'folder', children: [
          { name: 'helpers.ts', type: 'file' },
        ]},
      ],
    },
    { name: 'README.md', type: 'file' },
  ],
  onSelect: (node) => console.log('Selected:', node.name),
});

console.log(explorer.getSelected()); // null initially
explorer.destroy();
```

## Approach Hints

<details>
<summary>Hint 1</summary>
Use a recursive function to render each <code>FileNode</code>. For folders, create a wrapper with a toggle button and a nested container for children. For files, create a simple clickable item.
</details>

<details>
<summary>Hint 2</summary>
Track expanded state per folder using a <code>Set</code> or <code>Map</code>. On click, toggle the folder's presence in the set and show/hide the children container.
</details>

<details>
<summary>Hint 3</summary>
Store a reference to the currently selected element. On selection, remove the <code>active</code> class from the previously selected element and add it to the new one.
</details>
