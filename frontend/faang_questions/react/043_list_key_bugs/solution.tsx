import { useState } from 'react';

// FIXED — rows are keyed by the item's stable id, not by array index.
//
// Fix (and why it matters):
// 1. `key={index}` → `key={title.id}`. `key` is the identity signal React uses
//    during reconciliation to match the previous children to the new ones.
//    With index keys, `[A, B, C]` → `[B, A, C]` presents the SAME keys 0,1,2 in
//    the same slots, so React keeps every fiber and DOM node in place and
//    merely patches the props that differ (the label text, the button label).
//    Anything the DOM node owns — the uncontrolled `<input>`'s value, focus,
//    scroll position, in-flight CSS transitions — stays at the old slot, and
//    row-local `useState` would be stranded the same way. With id keys React
//    sees key `t-alpha` moved from slot 0 to slot 1: it reuses Alpha's fiber
//    and DOM subtree, MOVES the node (a single `insertBefore`), and leaves
//    Charlie's node untouched. The note travels with Alpha because the DOM
//    node that holds it is Alpha's.
//
// Index-as-key is only safe when ALL of: the list is never reordered,
// never filtered/inserted/removed at the front or middle, and rows hold no
// state (DOM or React) worth preserving. `key={Math.random()}` is the opposite
// failure: every render unmounts and remounts every row, wiping all state.

export type Title = {
  id: string;
  name: string;
};

export const TITLES: Title[] = [
  { id: 't-alpha', name: 'Alpha' },
  { id: 't-bravo', name: 'Bravo' },
  { id: 't-charlie', name: 'Charlie' },
];

type RowProps = {
  title: Title;
  onMoveDown: (id: string) => void;
  onRender?: (id: string) => void;
};

function Row({ title, onMoveDown, onRender }: RowProps) {
  onRender?.(`row-${title.id}`);
  return (
    <li>
      <span>{title.name}</span>
      {/* Uncontrolled on purpose: the DOM node owns this value, which is
          exactly the state that a wrong key leaves behind on reorder. */}
      <input aria-label={`Note for ${title.name}`} defaultValue="" />
      <button onClick={() => onMoveDown(title.id)}>Move {title.name} down</button>
    </li>
  );
}

type TitleListProps = {
  initialTitles?: Title[];
  onRender?: (id: string) => void;
};

export function TitleList({ initialTitles = TITLES, onRender }: TitleListProps) {
  onRender?.('list');
  const [titles, setTitles] = useState(initialTitles);

  const moveDown = (id: string) => {
    setTitles((prev) => {
      const index = prev.findIndex((t) => t.id === id);
      if (index === -1 || index === prev.length - 1) return prev;
      const next = prev.slice();
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  return (
    <ol>
      {titles.map((title) => (
        // Fix 1: identity derived from data, stable across reorders.
        <Row key={title.id} title={title} onMoveDown={moveDown} onRender={onRender} />
      ))}
    </ol>
  );
}
