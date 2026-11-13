/**
 * Reference solution for 105 — keep transfer_list.tsx as the stub for redo
 * practice; this file is for comparison after your own attempt.
 *
 * Design in one breath: membership is the controlled `value` (a Set whose
 * insertion order is the right-hand display order); highlight is local UI
 * state, one Set per side; filter text is local; everything else — the two
 * columns, the visible subsets, button enablement, the status line — is
 * derived at render.
 */
import {
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type ReactElement,
} from 'react';

export interface TransferItem {
  id: string;
  label: string;
}

export type MoveDirection = 'right' | 'left';

export interface TransferListProps {
  /** Every item, in canonical (left-side) order. */
  items: readonly TransferItem[];
  /** Ids currently on the right. Iteration order of the Set = display order on the right. */
  value: ReadonlySet<string>;
  onChange: (next: Set<string>) => void;
  /** Listbox names. Defaults to `{ left: 'Available', right: 'Selected' }`. */
  titles?: { left: string; right: string };
}

export interface Partition {
  left: TransferItem[];
  right: TransferItem[];
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/**
 * Split `items` into the two columns. `left` keeps `items` order; `right`
 * follows the insertion order of `value` (ids in `value` without an item are skipped).
 */
export function partition(items: readonly TransferItem[], value: ReadonlySet<string>): Partition {
  const byId = new Map(items.map((item) => [item.id, item]));
  const left = items.filter((item) => !value.has(item.id));
  const right: TransferItem[] = [];
  for (const id of value) {
    const item = byId.get(id);
    if (item) right.push(item);
  }
  return { left, right };
}

/** Returns a NEW Set: `right` appends `ids` in the given order, `left` removes them. */
export function moveIds(
  value: ReadonlySet<string>,
  ids: readonly string[],
  direction: MoveDirection,
): Set<string> {
  const next = new Set(value);
  for (const id of ids) {
    if (direction === 'right') next.add(id);
    else next.delete(id);
  }
  return next;
}

const matches = (item: TransferItem, filter: string): boolean =>
  item.label.toLowerCase().includes(filter.trim().toLowerCase());

/** Keep only the highlighted ids that are still visible. */
function prune(highlight: Set<string>, visible: readonly TransferItem[]): Set<string> {
  const keep = new Set(visible.map((i) => i.id));
  const next = new Set<string>();
  for (const id of highlight) if (keep.has(id)) next.add(id);
  return next;
}

// ---------------------------------------------------------------------------
// One side of the widget: filter + multiselect listbox with a roving tabindex.
// ---------------------------------------------------------------------------

type Side = 'left' | 'right';

interface ColumnProps {
  side: Side;
  title: string;
  visible: TransferItem[]; // after the filter
  filter: string;
  onFilterChange: (text: string) => void;
  highlight: Set<string>;
  onHighlightChange: (next: Set<string>) => void;
}

function Column({
  side,
  title,
  visible,
  filter,
  onFilterChange,
  highlight,
  onHighlightChange,
}: ColumnProps): ReactElement {
  // Roving tabindex: the option that takes Tab focus. Falls back to the first
  // visible option when the remembered one is filtered out.
  const [active, setActive] = useState<string | null>(null);
  const activeId = active !== null && visible.some((i) => i.id === active) ? active : visible[0]?.id ?? null;
  const optionRefs = useRef(new Map<string, HTMLElement>());

  const toggle = (id: string) => {
    const next = new Set(highlight);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onHighlightChange(next);
  };

  const focusOption = (id: string) => {
    setActive(id);
    optionRefs.current.get(id)?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const currentId = (e.target as HTMLElement).dataset.id ?? activeId;
    if (currentId === null) return;
    const idx = visible.findIndex((i) => i.id === currentId);
    if (idx < 0) return;

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
      onHighlightChange(new Set(visible.map((i) => i.id)));
      e.preventDefault();
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        const nextIdx = Math.min(visible.length - 1, Math.max(0, idx + (e.key === 'ArrowDown' ? 1 : -1)));
        const nextId = visible[nextIdx].id;
        if (e.shiftKey) {
          // Extend: both the option we leave and the one we land on.
          const next = new Set(highlight);
          next.add(currentId);
          next.add(nextId);
          onHighlightChange(next);
        }
        focusOption(nextId);
        break;
      }
      case ' ':
        toggle(currentId);
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  const handleFocus = (e: FocusEvent<HTMLElement>) => {
    const id = (e.target as HTMLElement).dataset.id;
    if (id) setActive(id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 180 }}>
      <h3 style={{ margin: 0, fontSize: 14 }}>{title}</h3>
      <input
        type="search"
        aria-label={`Filter ${title.toLowerCase()}`}
        placeholder="Filter…"
        value={filter}
        onChange={(e) => onFilterChange(e.target.value)}
      />
      <ul
        role="listbox"
        aria-label={title}
        aria-multiselectable="true"
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        style={{ listStyle: 'none', margin: 0, padding: 0, border: '1px solid #ccc', minHeight: 120 }}
      >
        {visible.map((item) => {
          const selected = highlight.has(item.id);
          return (
            <li
              key={item.id}
              role="option"
              data-id={item.id}
              aria-selected={selected}
              tabIndex={item.id === activeId ? 0 : -1}
              ref={(el) => {
                if (el) optionRefs.current.set(item.id, el);
                else optionRefs.current.delete(item.id);
              }}
              onClick={() => {
                setActive(item.id);
                toggle(item.id);
              }}
              style={{
                padding: '4px 8px',
                cursor: 'default',
                background: selected ? '#cde' : 'transparent',
              }}
            >
              {item.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The widget
// ---------------------------------------------------------------------------

const DEFAULT_TITLES = { left: 'Available', right: 'Selected' };

export function TransferList({ items, value, onChange, titles = DEFAULT_TITLES }: TransferListProps): ReactElement {
  const { left, right } = partition(items, value);

  const [filterLeft, setFilterLeft] = useState('');
  const [filterRight, setFilterRight] = useState('');
  const [hlLeft, setHlLeft] = useState<Set<string>>(() => new Set());
  const [hlRight, setHlRight] = useState<Set<string>>(() => new Set());

  // Derived at render: never copied into state.
  const visibleLeft = left.filter((i) => matches(i, filterLeft));
  const visibleRight = right.filter((i) => matches(i, filterRight));

  // Highlighted *visible* ids, in display order — what "Move selected" acts on.
  const pickedLeft = visibleLeft.filter((i) => hlLeft.has(i.id)).map((i) => i.id);
  const pickedRight = visibleRight.filter((i) => hlRight.has(i.id)).map((i) => i.id);

  /** Changing a filter drops the highlight of anything it hides, permanently. */
  const changeFilter = (side: Side, text: string) => {
    if (side === 'left') {
      setFilterLeft(text);
      setHlLeft((prev) => prune(prev, left.filter((i) => matches(i, text))));
    } else {
      setFilterRight(text);
      setHlRight((prev) => prune(prev, right.filter((i) => matches(i, text))));
    }
  };

  const move = (ids: readonly string[], direction: MoveDirection) => {
    if (ids.length === 0) return;
    onChange(moveIds(value, ids, direction));
    // Moved items land unhighlighted on the other side; the rest lose their
    // highlight too, so the next action starts from a clean slate.
    setHlLeft(new Set());
    setHlRight(new Set());
  };

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <Column
        side="left"
        title={titles.left}
        visible={visibleLeft}
        filter={filterLeft}
        onFilterChange={(t) => changeFilter('left', t)}
        highlight={hlLeft}
        onHighlightChange={setHlLeft}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignSelf: 'center' }}>
        <button
          type="button"
          aria-label="Move all right"
          disabled={visibleLeft.length === 0}
          onClick={() => move(visibleLeft.map((i) => i.id), 'right')}
        >
          »
        </button>
        <button
          type="button"
          aria-label="Move selected right"
          disabled={pickedLeft.length === 0}
          onClick={() => move(pickedLeft, 'right')}
        >
          ›
        </button>
        <button
          type="button"
          aria-label="Move selected left"
          disabled={pickedRight.length === 0}
          onClick={() => move(pickedRight, 'left')}
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Move all left"
          disabled={visibleRight.length === 0}
          onClick={() => move(visibleRight.map((i) => i.id), 'left')}
        >
          «
        </button>
      </div>

      <Column
        side="right"
        title={titles.right}
        visible={visibleRight}
        filter={filterRight}
        onFilterChange={(t) => changeFilter('right', t)}
        highlight={hlRight}
        onHighlightChange={setHlRight}
      />

      <p role="status" style={{ margin: 0, alignSelf: 'center' }}>
        {right.length} of {items.length} selected
      </p>
    </div>
  );
}
