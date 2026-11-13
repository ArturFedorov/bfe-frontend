import React, { ReactElement, useId, useRef, useState } from 'react';

export interface LabelOption {
  /** Single digit '1'-'9' */
  key: string;
  name: string;
}

export interface LabelItem {
  id: string;
  text: string;
}

/** itemId -> label key */
export type Assignments = Record<string, string | undefined>;

export interface LabelHotkeysProps {
  items: LabelItem[];
  labels: LabelOption[];
  value: Assignments;
  onChange: (next: Assignments) => void;
}

/**
 * Keyboard-first classifier.
 *
 * Design notes:
 * - Fully controlled: `value` is the only source of truth for assignments;
 *   every change goes out through `onChange`. Only the cursor (active index)
 *   is internal UI state.
 * - A single `onKeyDown` on the listbox (not a window listener). Keystrokes
 *   in the Note textarea never bubble through the listbox, so hotkeys are
 *   scoped by construction.
 * - Roving tabindex: exactly one option is tabbable (the active one). Refs
 *   to each option let us move DOM focus whenever the cursor moves, so the
 *   next arrow key keeps working after a label advances the cursor.
 * - `aria-selected` announces position; `aria-describedby` points at the
 *   label text so assistive tech hears the applied label.
 */
export function LabelHotkeys({ items, labels, value, onChange }: LabelHotkeysProps): ReactElement {
  const baseId = useId();
  const [activeIndex, setActiveIndex] = useState(0);
  const optionRefs = useRef<Array<HTMLLIElement | null>>([]);

  const labelByKey = new Map(labels.map((label) => [label.key, label]));
  // Only ids that exist in `items` count towards progress (stale ids ignored).
  const labeledCount = items.filter((item) => value[item.id] !== undefined).length;

  /** Clamp to [0, items.length - 1], update the cursor and move DOM focus. */
  const moveTo = (index: number) => {
    if (items.length === 0) return;
    const clamped = Math.max(0, Math.min(items.length - 1, index));
    setActiveIndex(clamped);
    optionRefs.current[clamped]?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    const active = items[activeIndex];
    if (!active) return;

    switch (event.key) {
      case 'ArrowUp':
      case 'k':
        event.preventDefault();
        moveTo(activeIndex - 1);
        return;
      case 'ArrowDown':
      case 'j':
        event.preventDefault();
        moveTo(activeIndex + 1);
        return;
      case 'Backspace':
        event.preventDefault();
        onChange({ ...value, [active.id]: undefined });
        return;
      default: {
        const label = labelByKey.get(event.key);
        // Unknown key: let it through untouched, cursor stays put.
        if (!label) return;
        event.preventDefault();
        onChange({ ...value, [active.id]: label.key });
        // Advance, but never past the last item.
        moveTo(activeIndex + 1);
      }
    }
  };

  return (
    <div>
      <ul aria-label="Labels">
        {labels.map((label) => (
          <li key={label.key}>
            <kbd>{label.key}</kbd> {label.name}
          </li>
        ))}
      </ul>

      <ul role="listbox" aria-label="Items" onKeyDown={handleKeyDown}>
        {items.map((item, index) => {
          const assignedKey = value[item.id];
          const label = assignedKey !== undefined ? labelByKey.get(assignedKey) : undefined;
          const descriptionId = `${baseId}-label-${item.id}`;
          const isActive = index === activeIndex;

          return (
            <li
              key={item.id}
              ref={(el) => {
                optionRefs.current[index] = el;
              }}
              role="option"
              aria-selected={isActive}
              aria-describedby={label ? descriptionId : undefined}
              tabIndex={isActive ? 0 : -1}
              onClick={() => moveTo(index)}
            >
              {item.text}
              {label && <span id={descriptionId}> {label.name}</span>}
            </li>
          );
        })}
      </ul>

      <div role="status">
        {labeledCount} of {items.length} labeled
      </div>

      <label>
        Note
        <textarea />
      </label>
    </div>
  );
}
