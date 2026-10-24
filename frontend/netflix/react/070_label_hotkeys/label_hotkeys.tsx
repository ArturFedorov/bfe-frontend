import React, {ReactElement, useId, useRef, useState} from 'react';

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

export function LabelHotkeys({ items, labels, value, onChange }: LabelHotkeysProps): ReactElement {
  const baseId = useId();
  const [activeIndex, setActiveIndex] = useState(0);
  const optionsRefs = useRef<Array<HTMLLIElement | null>>([]);
  const labelByKey = new Map(labels.map((label) => [label.key, label]));
  const labelCount = items.filter((item) => value[item.id] !== undefined).length;

  const moveTo = (index: number) => {
    const clamped = Math.max(0, Math.min(items.length - 1, index));
    setActiveIndex(clamped);
    optionsRefs.current[clamped]?.focus();
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    const active = items[activeIndex];
    if(!active) return;

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
      default:
        const label = labelByKey.get(event.key);
        if(!label) return;
        event.preventDefault();
        onChange({ ...value, [active.id]: label.key });
        moveTo(activeIndex + 1);
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
          const label = value[item.id] !== undefined ? labelByKey.get(value[item.id] as string) : undefined;
          const descriptionId = `${baseId}-label-${item.id}`;
          const isActive = activeIndex === index;

          return (
            <li
              key={item.id}
              ref={(el) => {
                optionsRefs.current[index] = el;
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
          )
        })}
      </ul>
      <div role="status">
        {labelCount} of {items.length} labeled
      </div>
      <label>
        Note
        <textarea />
      </label>
    </div>
  )
}
