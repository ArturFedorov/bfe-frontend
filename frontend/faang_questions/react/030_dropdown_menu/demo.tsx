import { useState } from 'react';
import { DropdownMenu, DropdownMenuItem } from './dropdown_menu';

/**
 * Demo harness for DropdownMenu — auto-discovered by the playground
 * (playground/App.tsx). This file is not part of the task: the spec lives in
 * README.md and the grader is dropdown_menu.test.tsx.
 */

const ITEMS: DropdownMenuItem[] = [
  { id: 'retry', label: 'Retry delivery' },
  { id: 'manifest', label: 'View manifest' },
  { id: 'archive', label: 'Archive', disabled: true },
];

export default function Demo() {
  const [lastAction, setLastAction] = useState<string | null>(null);

  return (
    <div className="demo">
      <h2>Dropdown Menu</h2>
      <p className="demo-note">
        Implement <code>DropdownMenu</code> in <code>dropdown_menu.tsx</code> —
        ARIA menu pattern with outside-click close and arrow-key navigation
        that skips disabled items. "Archive" is disabled (delivery in flight);
        try ArrowDown/ArrowUp wrapping past it, Escape, and clicking outside.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <DropdownMenu label="Actions" items={ITEMS} onSelect={setLastAction} />
          <button>Some other control (click here to test outside close)</button>
        </div>
        <p className="demo-note">
          Last action: {lastAction ?? '(none yet)'}
        </p>
      </div>
    </div>
  );
}
