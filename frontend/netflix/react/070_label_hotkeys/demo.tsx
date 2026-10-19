import { useState } from 'react';
import { LabelHotkeys, Assignments, LabelItem, LabelOption } from './label_hotkeys';

/**
 * Demo harness for LabelHotkeys — auto-discovered by the playground
 * (playground/App.tsx). This file is not part of the task: the spec lives in
 * README.md and the grader is label_hotkeys.test.tsx.
 */

const LABELS: LabelOption[] = [
  { key: '1', name: 'Positive' },
  { key: '2', name: 'Negative' },
  { key: '3', name: 'Neutral' },
  { key: '4', name: 'Spam' },
];

const ITEMS: LabelItem[] = [
  { id: 'u1', text: 'Loved the new episode, the finale was perfect.' },
  { id: 'u2', text: 'Player keeps buffering every two minutes.' },
  { id: 'u3', text: 'It was fine I guess, nothing special.' },
  { id: 'u4', text: 'FREE GIFT CARDS!!! click the link in bio' },
  { id: 'u5', text: 'Subtitles are out of sync on season 3.' },
  { id: 'u6', text: 'Finally a show my whole family agrees on.' },
  { id: 'u7', text: 'Is this available in 4K?' },
  { id: 'u8', text: 'Cancelling after this price hike.' },
];

export default function Demo() {
  const [assignments, setAssignments] = useState<Assignments>({});

  return (
    <div className="demo">
      <h2>Label Hotkeys</h2>
      <p className="demo-note">
        Implement <code>LabelHotkeys</code> in <code>label_hotkeys.tsx</code> —
        a keyboard-first classifier with roving focus. Tab into the list, move
        with <kbd>↑</kbd>/<kbd>↓</kbd> or <kbd>j</kbd>/<kbd>k</kbd>, press a
        digit to label the active utterance and advance, <kbd>Backspace</kbd>{' '}
        to clear. Hotkeys must stay quiet while typing in the note field.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <button onClick={() => setAssignments({})}>Reset</button>
        </div>
        <LabelHotkeys
          items={ITEMS}
          labels={LABELS}
          value={assignments}
          onChange={setAssignments}
        />
      </div>
    </div>
  );
}
