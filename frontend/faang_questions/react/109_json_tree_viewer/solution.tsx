/**
 * Reference solution for 109 — keep json_tree.tsx blank for redo practice;
 * this file is for comparison after your own attempt.
 *
 * State shape (say it out loud first):
 *   expanded   Set<path>        containers whose children are emitted
 *   shown      Map<path, n>     how many children of a container are visible (paging)
 *   query      string           the search box
 *   activePath string           the roving tab stop
 * Rows (`flattenJson`) and matches (`searchPaths`) are derived with `useMemo`;
 * nothing is duplicated and no effect synchronises `expanded` with the query.
 */
import { useEffect, useId, useMemo, useRef, useState, type JSX, type KeyboardEvent, type MouseEvent } from 'react';

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type RowType = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';

export interface Row {
  /** JSON-pointer-like path without a leading slash: `''` for the root, `'a/0/b'` for nested values. */
  path: string;
  /** Property name or array index as a string; `'root'` for the root. */
  key: string;
  /** `'more'` marks the synthetic "Show N more" row that follows a truncated child list. */
  type: RowType | 'more';
  /** `{3 keys}`, `[120 items]`, `"text"`, `42`, `true`, `null`; for `'more'` rows the button label. */
  preview: string;
  depth: number;
  expandable: boolean;
  /** Children for containers; remaining hidden children for a `'more'` row; 0 for primitives. */
  childCount: number;
}

/** How many children of one container render before a `Show N more` row. */
export const PAGE_SIZE = 100;

export interface FlattenOptions {
  /** Paths whose children are emitted. */
  expanded: Set<string>;
  /** Per-path number of children currently shown; defaults to `pageSize`. */
  shown?: Map<string, number>;
  pageSize?: number;
}

export interface JsonTreeProps {
  value: JsonValue;
  /** Containers at depth < this start expanded. Default 1 (root open, children closed). */
  defaultExpandedDepth?: number;
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

type JsonObject = { [key: string]: JsonValue };

function typeOf(value: JsonValue): RowType {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  const t = typeof value;
  if (t === 'string' || t === 'number' || t === 'boolean') return t;
  return 'object';
}

const isContainer = (value: JsonValue): value is JsonValue[] | JsonObject =>
  typeof value === 'object' && value !== null;

/** Number of children without materialising a key list for arrays. */
function childCountOf(value: JsonValue[] | JsonObject): number {
  return Array.isArray(value) ? value.length : Object.keys(value).length;
}

/** The `i`-th child as `[key, value]` — arrays by index, objects by insertion order. */
function childEntries(value: JsonValue[] | JsonObject, limit: number): Array<[string, JsonValue]> {
  if (Array.isArray(value)) {
    const out: Array<[string, JsonValue]> = [];
    for (let i = 0; i < Math.min(limit, value.length); i++) out.push([String(i), value[i]]);
    return out;
  }
  return Object.keys(value)
    .slice(0, limit)
    .map((k) => [k, value[k]]);
}

function previewOf(value: JsonValue): string {
  if (Array.isArray(value)) {
    const n = value.length;
    return n === 0 ? '[]' : `[${n} ${n === 1 ? 'item' : 'items'}]`;
  }
  if (isContainer(value)) {
    const n = Object.keys(value).length;
    return n === 0 ? '{}' : `{${n} ${n === 1 ? 'key' : 'keys'}}`;
  }
  return typeof value === 'string' ? JSON.stringify(value) : String(value);
}

const joinPath = (parent: string, key: string): string => (parent === '' ? key : `${parent}/${key}`);

/** `'a/0/b'` → `['', 'a', 'a/0']`; `''` → `[]`. */
export function ancestorsOf(path: string): string[] {
  if (path === '') return [];
  const segments = path.split('/');
  const out = [''];
  for (let i = 1; i < segments.length; i++) out.push(segments.slice(0, i).join('/'));
  return out;
}

/**
 * Depth-first rows in display order. Only the children of paths in `expanded` are visited,
 * so a collapsed 100k-element array costs exactly one row.
 */
export function flattenJson(value: JsonValue, options: FlattenOptions): Row[] {
  const { expanded, shown, pageSize = PAGE_SIZE } = options;
  const rows: Row[] = [];

  const visit = (node: JsonValue, path: string, key: string, depth: number): void => {
    const container = isContainer(node);
    const count = container ? childCountOf(node) : 0;
    rows.push({
      path,
      key,
      type: typeOf(node),
      preview: previewOf(node),
      depth,
      expandable: count > 0,
      childCount: count,
    });
    if (!container || count === 0 || !expanded.has(path)) return;

    // Paging: emit at most `shown` children, then one synthetic "more" row.
    const limit = Math.min(shown?.get(path) ?? pageSize, count);
    for (const [childKey, child] of childEntries(node, limit)) {
      visit(child, joinPath(path, childKey), childKey, depth + 1);
    }
    const remaining = count - limit;
    if (remaining > 0) {
      rows.push({
        path: `${path}/#more`,
        key: '',
        type: 'more',
        preview: `Show ${Math.min(pageSize, remaining)} more`,
        depth: depth + 1,
        expandable: false,
        childCount: remaining,
      });
    }
  };

  visit(value, '', 'root', 0);
  return rows;
}

/**
 * Paths whose key or primitive value contains `query` (case-insensitive). Empty query → `[]`.
 * Expand `ancestorsOf(path)` for each result to reveal it.
 */
export function searchPaths(value: JsonValue, query: string): string[] {
  const needle = query.trim().toLowerCase();
  if (needle === '') return [];
  const out: string[] = [];

  const visit = (node: JsonValue, path: string, key: string | null): void => {
    // The root has no key segment of its own ('root' is only a display label).
    const keyHit = key !== null && key.toLowerCase().includes(needle);
    if (isContainer(node)) {
      if (keyHit) out.push(path);
      for (const [childKey, child] of childEntries(node, Number.POSITIVE_INFINITY)) {
        visit(child, joinPath(path, childKey), childKey);
      }
      return;
    }
    // Primitives match on the raw value text (strings without their quotes).
    const valueHit = String(node).toLowerCase().includes(needle);
    if (keyHit || valueHit) out.push(path);
  };

  visit(value, '', null);
  return out;
}

/** Containers at depth < `maxDepth`, i.e. the initial `expanded` set. */
function containersAbove(value: JsonValue, maxDepth: number): Set<string> {
  const out = new Set<string>();
  const visit = (node: JsonValue, path: string, depth: number): void => {
    if (depth >= maxDepth || !isContainer(node) || childCountOf(node) === 0) return;
    out.add(path);
    for (const [childKey, child] of childEntries(node, Number.POSITIVE_INFINITY)) {
      visit(child, joinPath(path, childKey), depth + 1);
    }
  };
  visit(value, '', 0);
  return out;
}

/** The container a `more` row belongs to (`'a/#more'` → `'a'`). */
const moreParent = (path: string): string => path.slice(0, -'/#more'.length);

function copyPath(path: string): void {
  // Undefined over plain HTTP; rejects without a user gesture — swallow, the tree stays usable.
  void navigator.clipboard?.writeText(path).catch(() => undefined);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function JsonTree({ value, defaultExpandedDepth = 1 }: JsonTreeProps): JSX.Element {
  const [expanded, setExpanded] = useState<Set<string>>(() => containersAbove(value, defaultExpandedDepth));
  const [shown, setShown] = useState<Map<string, number>>(() => new Map());
  const [query, setQuery] = useState('');
  const [activePath, setActivePath] = useState('');

  const searchId = useId();
  const rowRefs = useRef(new Map<string, HTMLLIElement>());
  // Path to focus after the next commit (the target <li> may not exist yet).
  const pendingFocus = useRef<string | null>(null);

  const rows = useMemo(() => flattenJson(value, { expanded, shown }), [value, expanded, shown]);
  const matches = useMemo(() => new Set(searchPaths(value, query)), [value, query]);

  // The active row may have vanished (parent collapsed); fall back to the first row
  // so the tree never loses its tab stop.
  const tabStopPath = rows.some((r) => r.path === activePath) ? activePath : (rows[0]?.path ?? '');

  useEffect(() => {
    const target = pendingFocus.current;
    if (target === null) return;
    pendingFocus.current = null;
    rowRefs.current.get(target)?.focus();
  });

  const toggle = (path: string): void => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const showMore = (parentPath: string): void => {
    setShown((prev) => new Map(prev).set(parentPath, (prev.get(parentPath) ?? PAGE_SIZE) + PAGE_SIZE));
  };

  const moveTo = (path: string | undefined): void => {
    if (path === undefined) return;
    setActivePath(path);
    pendingFocus.current = path;
  };

  const onSearch = (next: string): void => {
    setQuery(next);
    // Reveal every match now, in the handler — rows stay open when the query is cleared.
    const hits = searchPaths(value, next);
    if (hits.length === 0) return;
    setExpanded((prev) => {
      const out = new Set(prev);
      for (const hit of hits) for (const ancestor of ancestorsOf(hit)) out.add(ancestor);
      return out;
    });
  };

  const onRowClick = (row: Row): void => {
    setActivePath(row.path);
    if (row.type === 'more') showMore(moreParent(row.path));
    else if (row.expandable) toggle(row.path);
  };

  const onRowKeyDown = (event: KeyboardEvent<HTMLLIElement>, row: Row, index: number): void => {
    const isOpen = row.expandable && expanded.has(row.path);
    switch (event.key) {
      case 'ArrowDown':
        moveTo(rows[Math.min(index + 1, rows.length - 1)]?.path);
        break;
      case 'ArrowUp':
        moveTo(rows[Math.max(index - 1, 0)]?.path);
        break;
      case 'Home':
        moveTo(rows[0]?.path);
        break;
      case 'End':
        moveTo(rows[rows.length - 1]?.path);
        break;
      case 'ArrowRight':
        if (!row.expandable) return;
        if (isOpen) moveTo(rows[index + 1]?.path); // first child is the next row
        else toggle(row.path);
        break;
      case 'ArrowLeft':
        if (isOpen) toggle(row.path);
        else moveTo(ancestorsOf(row.path).at(-1));
        break;
      case 'Enter':
      case ' ':
        if (row.type === 'more') showMore(moreParent(row.path));
        else if (row.expandable) toggle(row.path);
        else return;
        break;
      case 'c':
        // Bare `c` only — leave Cmd/Ctrl+C to the browser's own copy.
        if (row.type === 'more' || event.metaKey || event.ctrlKey || event.altKey) return;
        copyPath(row.path);
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  const onCopyClick = (event: MouseEvent, path: string): void => {
    event.stopPropagation(); // must not toggle the row
    copyPath(path);
  };

  const matchCount = matches.size;
  const statusText = query.trim() === '' ? '' : `${matchCount} ${matchCount === 1 ? 'match' : 'matches'}`;

  return (
    <div className="json-tree">
      <div className="json-tree-search">
        <label htmlFor={searchId}>Search</label>
        <input id={searchId} type="search" value={query} onChange={(e) => onSearch(e.target.value)} />
        <span role="status" className="json-tree-count">
          {statusText}
        </span>
      </div>

      <ul role="tree" aria-label="JSON" className="json-tree-list">
        {rows.map((row, index) => {
          const isMore = row.type === 'more';
          const isOpen = row.expandable && expanded.has(row.path);
          return (
            <li
              key={row.path}
              ref={(el) => {
                if (el) rowRefs.current.set(row.path, el);
                else rowRefs.current.delete(row.path);
              }}
              role="treeitem"
              aria-level={row.depth + 1}
              aria-expanded={row.expandable ? isOpen : undefined}
              tabIndex={row.path === tabStopPath ? 0 : -1}
              data-path={row.path}
              data-match={matches.has(row.path) ? '' : undefined}
              style={{ ['--depth' as string]: row.depth }}
              onClick={() => onRowClick(row)}
              onFocus={() => setActivePath(row.path)}
              onKeyDown={(event) => onRowKeyDown(event, row, index)}
            >
              {isMore ? (
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={(event) => {
                    event.stopPropagation();
                    setActivePath(row.path);
                    showMore(moreParent(row.path));
                  }}
                >
                  {row.preview}
                </button>
              ) : (
                <>
                  <span aria-hidden="true" className="json-tree-twisty">
                    {row.expandable ? (isOpen ? '▾' : '▸') : ''}
                  </span>
                  <span className="json-tree-key">{row.key}</span>{' '}
                  <span className="json-tree-type">{row.type}</span>{' '}
                  <span className="json-tree-preview">{row.preview}</span>{' '}
                  <button type="button" tabIndex={-1} onClick={(event) => onCopyClick(event, row.path)}>
                    Copy path
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
