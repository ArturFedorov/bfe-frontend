/**
 * Reference solution for 102 — keep file_tree.tsx as the stub for redo
 * practice; this file is for comparison after your own attempt.
 *
 * Design in one breath: selection lives ONLY in `props.value` (leaf ids);
 * folder tri-states are derived at render with `folderState`; the component
 * owns just two pieces of UI state — which folders are expanded and which
 * treeitem holds the roving tabindex.
 */
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type FocusEvent,
  type ReactElement,
} from 'react';

export interface TreeNode {
  id: string;
  name: string;
  /** Present (even empty) => folder; absent => leaf. */
  children?: TreeNode[];
}

export type FolderState = 'none' | 'some' | 'all';

export interface FileTreeProps {
  nodes: TreeNode[];
  /** Selected LEAF ids. Folders are never stored; they derive from their leaves. */
  value: Set<string>;
  onChange: (next: Set<string>) => void;
  /** Folder ids that start expanded. Default: none. */
  defaultExpanded?: string[];
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

const isFolder = (node: TreeNode): boolean => Array.isArray(node.children);

/** Every leaf id under `node` in document order. A leaf returns [its own id]. */
export function leafIds(node: TreeNode): string[] {
  if (!isFolder(node)) return [node.id];
  const out: string[] = [];
  for (const child of node.children as TreeNode[]) out.push(...leafIds(child));
  return out;
}

/** 'all' when every leaf under `node` is selected, 'none' when none is, else 'some'. */
export function folderState(node: TreeNode, selected: Set<string>): FolderState {
  const leaves = leafIds(node);
  if (leaves.length === 0) return 'none'; // empty folder (or nothing selectable)
  let hit = 0;
  for (const id of leaves) if (selected.has(id)) hit++;
  if (hit === 0) return 'none';
  return hit === leaves.length ? 'all' : 'some';
}

// ---------------------------------------------------------------------------
// Visible-order walk: the keyboard model is "a flat list of what is on screen".
// Collapsed subtrees are simply not walked, so they never take part in
// ArrowUp / ArrowDown / Home / End.
// ---------------------------------------------------------------------------

interface VisibleItem {
  node: TreeNode;
  level: number;
  parentId: string | null;
}

function walkVisible(
  nodes: TreeNode[],
  expanded: Set<string>,
  level = 1,
  parentId: string | null = null,
  out: VisibleItem[] = [],
): VisibleItem[] {
  for (const node of nodes) {
    out.push({ node, level, parentId });
    if (isFolder(node) && expanded.has(node.id)) {
      walkVisible(node.children as TreeNode[], expanded, level + 1, node.id, out);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FileTree({ nodes, value, onChange, defaultExpanded = [] }: FileTreeProps): ReactElement {
  const baseId = useId();
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(defaultExpanded));
  // The item that currently holds tabIndex=0. Starts on the first root node.
  const [focusedId, setFocusedId] = useState<string | null>(() => nodes[0]?.id ?? null);
  // Set by key handlers so that, after React commits, we call .focus() on the
  // newly current item. Never true on mount — the tree must not steal focus.
  const focusPending = useRef(false);
  const itemRefs = useRef(new Map<string, HTMLElement>());

  const visible = walkVisible(nodes, expanded);
  const visibleIds = visible.map((v) => v.node.id);
  // If the focused item is no longer rendered (its folder was collapsed with
  // the mouse), fall back to the first visible item so one tab stop remains.
  const activeId = focusedId !== null && visibleIds.includes(focusedId) ? focusedId : visibleIds[0] ?? null;

  useEffect(() => {
    if (!focusPending.current || activeId === null) return;
    focusPending.current = false;
    itemRefs.current.get(activeId)?.focus();
  });

  const moveFocusTo = (id: string | null) => {
    if (id === null) return;
    focusPending.current = true;
    setFocusedId(id);
  };

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /** Cascade: 'all' => remove every leaf below; anything else => add them all. */
  const toggleSelection = (node: TreeNode) => {
    const leaves = leafIds(node);
    const next = new Set(value);
    if (folderState(node, value) === 'all') {
      for (const id of leaves) next.delete(id);
    } else {
      for (const id of leaves) next.add(id);
    }
    onChange(next);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>, item: VisibleItem) => {
    // Nested treeitems: a key pressed on a child bubbles to every ancestor
    // treeitem. Only the item that owns the event target acts on it.
    const target = e.target as HTMLElement;
    if (target.closest('[role="treeitem"]') !== e.currentTarget) return;

    const { node, parentId } = item;
    const idx = visibleIds.indexOf(node.id);
    const folder = isFolder(node);
    const open = expanded.has(node.id);

    switch (e.key) {
      case 'ArrowDown':
        moveFocusTo(visibleIds[idx + 1] ?? null);
        break;
      case 'ArrowUp':
        moveFocusTo(idx > 0 ? visibleIds[idx - 1] : null);
        break;
      case 'ArrowRight':
        if (!folder) return;
        if (!open) toggleExpanded(node.id);
        else moveFocusTo((node.children as TreeNode[])[0]?.id ?? null);
        break;
      case 'ArrowLeft':
        if (folder && open) toggleExpanded(node.id);
        else moveFocusTo(parentId);
        break;
      case 'Home':
        moveFocusTo(visibleIds[0] ?? null);
        break;
      case 'End':
        moveFocusTo(visibleIds[visibleIds.length - 1] ?? null);
        break;
      case ' ':
        // Space on the native checkbox already toggles it (and fires onChange
        // through the input). Only act when the treeitem itself is focused.
        if (target instanceof HTMLInputElement) return;
        toggleSelection(node);
        break;
      case 'Enter':
        if (!folder) return;
        toggleExpanded(node.id);
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  /** Mouse clicks on a checkbox move DOM focus into the item: follow with the roving tabindex. */
  const handleFocus = (e: FocusEvent<HTMLElement>, id: string) => {
    if ((e.target as HTMLElement).closest('[role="treeitem"]') === e.currentTarget) setFocusedId(id);
  };

  const renderItems = (list: TreeNode[], level: number, parentId: string | null): ReactElement[] =>
    list.map((node) => {
      const folder = isFolder(node);
      const open = folder && expanded.has(node.id);
      const state = folderState(node, value);
      const labelId = `${baseId}-${node.id}-label`;
      const item: VisibleItem = { node, level, parentId };

      return (
        <li
          key={node.id}
          role="treeitem"
          aria-level={level}
          aria-labelledby={labelId}
          aria-checked={state === 'some' ? 'mixed' : state === 'all'}
          aria-expanded={folder ? open : undefined}
          tabIndex={node.id === activeId ? 0 : -1}
          ref={(el) => {
            if (el) itemRefs.current.set(node.id, el);
            else itemRefs.current.delete(node.id);
          }}
          onKeyDown={(e) => handleKeyDown(e, item)}
          onFocus={(e) => handleFocus(e, node.id)}
          style={{ listStyle: 'none' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: (level - 1) * 16 }}>
            <input
              type="checkbox"
              aria-label={node.name}
              tabIndex={-1}
              checked={state === 'all'}
              // `indeterminate` is a DOM property only — no attribute — so a
              // ref callback is the idiomatic way to keep it in sync.
              ref={(el) => {
                if (el) el.indeterminate = state === 'some';
              }}
              onChange={() => toggleSelection(node)}
            />
            <span
              id={labelId}
              onClick={folder ? () => toggleExpanded(node.id) : undefined}
              style={{ cursor: folder ? 'pointer' : 'default', userSelect: 'none' }}
            >
              {node.name}
            </span>
          </div>
          {open && (
            <ul role="group" style={{ margin: 0, padding: 0 }}>
              {renderItems(node.children as TreeNode[], level + 1, node.id)}
            </ul>
          )}
        </li>
      );
    });

  return (
    <ul role="tree" aria-label="Files" style={{ margin: 0, padding: 0 }}>
      {renderItems(nodes, 1, null)}
    </ul>
  );
}
