import { useState } from 'react';
import { FileTree, type TreeNode } from './file_tree';

/**
 * Demo harness for FileTree — auto-discovered by the playground
 * (playground/App.tsx). Not part of the task: the spec lives in README.md and
 * the grader is file_tree.test.tsx.
 */

const NODES: TreeNode[] = [
  {
    id: 'media',
    name: 'Media',
    children: [
      {
        id: 'promos',
        name: 'Promos',
        children: [
          { id: 'promo_a', name: 'promo_a.mp4' },
          { id: 'promo_b', name: 'promo_b.mp4' },
          { id: 'promo_c', name: 'promo_c.mp4' },
        ],
      },
      {
        id: 'trailers',
        name: 'Trailers',
        children: [
          { id: 'trailer_1', name: 'trailer_1.mov' },
          { id: 'trailer_2', name: 'trailer_2.mov' },
        ],
      },
      { id: 'stills', name: 'Stills', children: [] },
    ],
  },
  {
    id: 'playlists',
    name: 'Playlists',
    children: [
      { id: 'autumn', name: 'autumn.json' },
      { id: 'holiday', name: 'holiday.json' },
    ],
  },
  { id: 'readme', name: 'readme.txt' },
];

export default function Demo() {
  const [value, setValue] = useState<Set<string>>(() => new Set(['promo_a']));

  return (
    <div className="demo">
      <h2>File Explorer Tree</h2>
      <p className="demo-note">
        Implement <code>FileTree</code>, <code>leafIds</code> and <code>folderState</code> in{' '}
        <code>file_tree.tsx</code>: a WAI-ARIA tree (<code>tree</code> / <code>treeitem</code> /{' '}
        <code>group</code>) with a tri-state checkbox per node. Checking a folder selects every leaf
        under it; a partially selected folder shows <code>indeterminate</code> and{' '}
        <code>aria-checked=&quot;mixed&quot;</code>. Selection is a <code>Set</code> of{' '}
        <strong>leaf ids only</strong>. Keyboard: <kbd>↑</kbd>/<kbd>↓</kbd> over visible items,{' '}
        <kbd>→</kbd> expand / enter, <kbd>←</kbd> collapse / parent, <kbd>Home</kbd>/<kbd>End</kbd>,{' '}
        <kbd>Space</kbd> toggles the checkbox, <kbd>Enter</kbd> toggles expansion.
      </p>
      <div className="demo-stage">
        <FileTree nodes={NODES} value={value} onChange={setValue} defaultExpanded={['media', 'promos']} />
        <div className="demo-controls">
          <button type="button" onClick={() => setValue(new Set())}>
            Clear selection
          </button>
        </div>
        <p className="demo-note">
          Selected leaves ({value.size}): {value.size === 0 ? 'none' : [...value].sort().join(', ')}
        </p>
      </div>
    </div>
  );
}
