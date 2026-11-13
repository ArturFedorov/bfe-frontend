import type { JSX } from 'react';

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

/** `'a/0/b'` → `['', 'a', 'a/0']`; `''` → `[]`. */
export function ancestorsOf(path: string): string[] {
  throw new Error('Not implemented');
}

/**
 * Depth-first rows in display order. Only the children of paths in `expanded` are visited,
 * so a collapsed 100k-element array costs exactly one row.
 */
export function flattenJson(value: JsonValue, options: FlattenOptions): Row[] {
  throw new Error('Not implemented');
}

/**
 * Paths whose key or primitive value contains `query` (case-insensitive). Empty query → `[]`.
 * Expand `ancestorsOf(path)` for each result to reveal it.
 */
export function searchPaths(value: JsonValue, query: string): string[] {
  throw new Error('Not implemented');
}

export function JsonTree(props: JsonTreeProps): JSX.Element {
  throw new Error('Not implemented');
}
