import { useState } from 'react';

// TODO: fix the performance problem below
//
// Symptom: reorder a title and the note you typed stays behind at the old
// POSITION instead of moving with the item. Ops has "lost" notes this way.
// The bug is a single attribute in TitleList — but you must be able to
// explain why it corrupts state and why the fix restores it.

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
      {titles.map((title, index) => (
        <Row key={index} title={title} onMoveDown={moveDown} onRender={onRender} />
      ))}
    </ol>
  );
}
