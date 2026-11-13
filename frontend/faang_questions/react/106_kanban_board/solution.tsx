/**
 * Reference solution for 106 — keep kanban_board.tsx as the stub for redo
 * practice; this file is for comparison after your own attempt.
 *
 * Design in one breath: the board is normalised and fully controlled. The
 * only local state is the keyboard move mode `{ cardId, columnId, index }`
 * (plus the live-region text); the *preview* board is derived on every render
 * with `moveCard(value, …)` and never stored. Both the keyboard path and the
 * pointer path commit through `moveCard`, and because `moveCard` returns the
 * same reference for a no-op, "did anything change?" is a single `!==`.
 */
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
} from 'react';

export interface Card {
  id: string;
  title: string;
}

export interface Column {
  id: string;
  title: string;
  cardIds: string[];
}

export interface Board {
  columns: Column[];
  cards: Record<string, Card>;
}

export interface KanbanBoardProps {
  value: Board;
  onChange: (next: Board) => void;
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n));

/** Column holding `cardId` and the card's index in it, or null. */
function locate(board: Board, cardId: string): { column: Column; index: number } | null {
  for (const column of board.columns) {
    const index = column.cardIds.indexOf(cardId);
    if (index !== -1) return { column, index };
  }
  return null;
}

/**
 * Move `cardId` into `toColumnId` at `toIndex`.
 * `toIndex` is the position in the destination's `cardIds` AFTER the card has
 * been removed from its source (so a same-column move counts positions without
 * the card itself). It is clamped to `[0, length]`.
 * Returns the SAME `board` reference when nothing changes (unknown card /
 * column, or the card is already at that position). Untouched columns and the
 * `cards` map keep their identity.
 */
export function moveCard(board: Board, cardId: string, toColumnId: string, toIndex: number): Board {
  const from = locate(board, cardId);
  const dest = board.columns.find((c) => c.id === toColumnId);
  if (!from || !dest) return board;

  const sameColumn = from.column.id === dest.id;
  // Positions are counted with the card already taken out of its source.
  const destWithout = sameColumn ? dest.cardIds.filter((id) => id !== cardId) : dest.cardIds;
  const index = clamp(Math.trunc(toIndex) || 0, 0, destWithout.length);

  // Already there: same column and the post-removal index equals the current one.
  if (sameColumn && index === from.index) return board;

  const newDestIds = [...destWithout.slice(0, index), cardId, ...destWithout.slice(index)];
  const newSourceIds = from.column.cardIds.filter((id) => id !== cardId);

  // Structural sharing: only the source and destination column objects (and
  // their arrays) are new; every other column and the `cards` map are reused.
  const columns = board.columns.map((column) => {
    if (column.id === dest.id) return { ...column, cardIds: newDestIds };
    if (column.id === from.column.id) return { ...column, cardIds: newSourceIds };
    return column;
  });
  return { columns, cards: board.cards };
}

/** Reorder within one column: the card at `from` ends up at `to` (same clamping and identity rules). */
export function reorderColumn(board: Board, columnId: string, from: number, to: number): Board {
  const column = board.columns.find((c) => c.id === columnId);
  if (!column || from < 0 || from >= column.cardIds.length) return board;
  const target = clamp(Math.trunc(to) || 0, 0, column.cardIds.length - 1);
  if (target === from) return board;
  return moveCard(board, column.cardIds[from], columnId, target);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/** Keyboard move mode: where the grabbed card would land if dropped now. */
interface MoveMode {
  cardId: string;
  columnId: string;
  index: number;
}

/** Pointer drag in progress. */
interface Drag {
  cardId: string;
  moved: boolean;
}

export function KanbanBoard({ value, onChange }: KanbanBoardProps): ReactElement {
  const [move, setMove] = useState<MoveMode | null>(null);
  const [status, setStatus] = useState('');

  // The preview is derived, never stored: Escape just drops `move` and the
  // real `value` renders again.
  const shown = move ? moveCard(value, move.cardId, move.columnId, move.index) : value;

  const titleOf = (cardId: string): string => value.cards[cardId]?.title ?? cardId;
  const columnTitle = (columnId: string): string => value.columns.find((c) => c.id === columnId)?.title ?? columnId;

  // --- keyboard move mode ---------------------------------------------------

  const moveButtons = useRef(new Map<string, HTMLButtonElement>());

  // Moving the preview into another column re-parents the <li>, so React
  // remounts it and focus falls to <body>. Put it back on the Move button.
  useEffect(() => {
    if (!move) return;
    const button = moveButtons.current.get(move.cardId);
    if (button && document.activeElement !== button) button.focus();
  }, [move, shown]);

  const startMove = (cardId: string) => {
    const at = locate(value, cardId);
    if (!at) return;
    setMove({ cardId, columnId: at.column.id, index: at.index });
    setStatus(`Moving "${titleOf(cardId)}". Use arrow keys to choose a position, Enter to drop, Escape to cancel`);
  };

  const commitMove = () => {
    if (!move) return;
    const next = moveCard(value, move.cardId, move.columnId, move.index);
    setMove(null);
    if (next !== value) {
      onChange(next);
      setStatus(`Dropped "${titleOf(move.cardId)}" in ${columnTitle(move.columnId)}, position ${move.index + 1}`);
    } else {
      setStatus(`"${titleOf(move.cardId)}" was not moved`);
    }
  };

  const cancelMove = () => {
    if (!move) return;
    setMove(null);
    setStatus(`Cancelled moving "${titleOf(move.cardId)}"`);
  };

  /** Number of *other* cards in `columnId` — the preview slot range is [0, that]. */
  const slotsIn = (columnId: string, cardId: string): number => {
    const column = value.columns.find((c) => c.id === columnId);
    if (!column) return 0;
    return column.cardIds.filter((id) => id !== cardId).length;
  };

  const retarget = (columnId: string, index: number) => {
    if (!move) return;
    const max = slotsIn(columnId, move.cardId);
    const next = { ...move, columnId, index: clamp(index, 0, max) };
    setMove(next);
    setStatus(
      `Moving "${titleOf(move.cardId)}" to ${columnTitle(columnId)}, position ${next.index + 1} of ${max + 1}`,
    );
  };

  const handleMoveKeyDown = (e: KeyboardEvent<HTMLButtonElement>, cardId: string) => {
    if (!move || move.cardId !== cardId) return;
    const colIdx = value.columns.findIndex((c) => c.id === move.columnId);
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowRight': {
        const nextIdx = clamp(colIdx + (e.key === 'ArrowRight' ? 1 : -1), 0, value.columns.length - 1);
        if (nextIdx === colIdx) break;
        const nextColumnId = value.columns[nextIdx].id;
        // Entering another column appends the card at its end.
        retarget(nextColumnId, slotsIn(nextColumnId, move.cardId));
        break;
      }
      case 'ArrowUp':
      case 'ArrowDown':
        retarget(move.columnId, move.index + (e.key === 'ArrowDown' ? 1 : -1));
        break;
      case 'Escape':
        cancelMove();
        break;
      // Enter and Space are left to the native button: they become a click,
      // and clicking the pressed Move button commits.
      default:
        return;
    }
    e.preventDefault();
  };

  // --- pointer drag -----------------------------------------------------------

  // Document listeners are attached at pointerdown time, so they read the
  // latest props through refs rather than a stale closure.
  const valueRef = useRef(value);
  valueRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const drag = useRef<Drag | null>(null);
  const detach = useRef<(() => void) | null>(null);

  // Never leave document listeners behind on unmount.
  useEffect(() => () => detach.current?.(), []);

  const handlePointerDown = (e: ReactPointerEvent<HTMLElement>, cardId: string) => {
    // The Move button has its own (keyboard) path; let its click through.
    if ((e.target as HTMLElement).closest('button')) return;
    if (e.button !== 0 && e.button !== undefined) return;
    detach.current?.();
    drag.current = { cardId, moved: false };

    const onMove = () => {
      if (drag.current) drag.current.moved = true;
    };
    const onUp = (ev: PointerEvent | MouseEvent) => {
      const d = drag.current;
      detach.current?.();
      if (!d || !d.moved) return; // press + release without travel is a click

      const hit = typeof document.elementFromPoint === 'function' ? document.elementFromPoint(ev.clientX, ev.clientY) : null;
      const zone = hit?.closest<HTMLElement>('[data-column-id]');
      if (!zone) return; // released outside every column: cancel silently
      const columnId = zone.dataset.columnId as string;

      // Drop index = other cards in that column whose vertical midpoint is above the pointer.
      let index = 0;
      for (const el of zone.querySelectorAll<HTMLElement>('[data-card-id]')) {
        if (el.dataset.cardId === d.cardId) continue;
        const rect = el.getBoundingClientRect();
        if ((rect.top + rect.bottom) / 2 < ev.clientY) index++;
      }

      const board = valueRef.current;
      const next = moveCard(board, d.cardId, columnId, index);
      if (next !== board) onChangeRef.current(next);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
    detach.current = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
      detach.current = null;
      drag.current = null;
    };
  };

  // --- render -----------------------------------------------------------------

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {shown.columns.map((column) => {
          const headingId = `kanban-col-${column.id}`;
          return (
            <section
              key={column.id}
              data-column-id={column.id}
              style={{ flex: '1 1 0', minWidth: 160, border: '1px solid #ccc', borderRadius: 6, padding: 8 }}
            >
              <h3 id={headingId} style={{ margin: '0 0 8px', fontSize: 14 }}>
                {column.title}
              </h3>
              <ul role="list" aria-labelledby={headingId} style={{ listStyle: 'none', margin: 0, padding: 0, minHeight: 40 }}>
                {column.cardIds.map((cardId) => {
                  const card = shown.cards[cardId];
                  if (!card) return null;
                  const grabbed = move?.cardId === cardId;
                  const titleId = `kanban-card-${cardId}-title`;
                  return (
                    <li
                      key={cardId}
                      data-card-id={cardId}
                      onPointerDown={(e) => handlePointerDown(e, cardId)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 8,
                        padding: 8,
                        marginBottom: 6,
                        border: '1px solid #bbb',
                        borderRadius: 4,
                        background: grabbed ? '#eef' : '#fff',
                        touchAction: 'none',
                        userSelect: 'none',
                      }}
                    >
                      <span id={titleId}>{card.title}</span>
                      <button
                        type="button"
                        aria-pressed={grabbed}
                        aria-describedby={titleId}
                        ref={(el) => {
                          if (el) moveButtons.current.set(cardId, el);
                          else moveButtons.current.delete(cardId);
                        }}
                        onClick={() => (grabbed ? commitMove() : startMove(cardId))}
                        onKeyDown={(e) => handleMoveKeyDown(e, cardId)}
                      >
                        Move
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
      <div role="status" aria-live="polite" style={{ marginTop: 8, minHeight: '1.2em' }}>
        {status}
      </div>
    </div>
  );
}
