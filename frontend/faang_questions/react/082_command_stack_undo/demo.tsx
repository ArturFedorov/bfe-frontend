import { ChangeEvent, useState } from 'react';
import { Command, useCommandHistory } from './use_command_history';

/**
 * Demo harness for useCommandHistory — auto-discovered by the playground
 * (playground/App.tsx). This file is not part of the task: the spec lives in
 * README.md and the grader is use_command_history.test.tsx.
 *
 * The hook is pure, so the demo is a tiny sentiment labeler built on top of
 * it: label buttons coalesce per utterance, the note input coalesces as
 * typing, and "label all remaining" is one batch entry.
 */

type Sentiment = 'Positive' | 'Negative' | 'Neutral';

interface Utterance {
  id: string;
  text: string;
  label: Sentiment | null;
}

interface Model {
  items: Utterance[];
  note: string;
}

const SENTIMENTS: Sentiment[] = ['Positive', 'Negative', 'Neutral'];

const INITIAL: Model = {
  items: [
    { id: 'u1', text: 'The new segmenter is noticeably faster on large images.', label: null },
    { id: 'u2', text: 'Half of the suggested boxes were off by a few pixels.', label: null },
    { id: 'u3', text: 'Export finished without errors this time.', label: null },
    { id: 'u4', text: 'Reviewer queue is still showing yesterday’s batch.', label: null },
    { id: 'u5', text: 'Keyboard shortcuts work as documented.', label: null },
    { id: 'u6', text: 'Label palette colours are hard to tell apart.', label: null },
  ],
  note: '',
};

function withLabel(id: string, label: Sentiment | null) {
  return (state: Model): Model => ({
    ...state,
    items: state.items.map((item) => (item.id === id ? { ...item, label } : item)),
  });
}

function setLabelCommand(item: Utterance, label: Sentiment): Command<Model> {
  return {
    label: `Label ${item.id} as ${label}`,
    do: withLabel(item.id, label),
    undo: withLabel(item.id, item.label),
    mergeKey: `label:${item.id}`,
  };
}

function typeNoteCommand(previous: string, next: string): Command<Model> {
  return {
    label: 'Type',
    do: (state) => ({ ...state, note: next }),
    undo: (state) => ({ ...state, note: previous }),
    mergeKey: 'typing',
  };
}

interface Counters {
  executed: number;
  undone: number;
  redone: number;
}

function Labeler() {
  const { state, execute, undo, redo, canUndo, canRedo, beginBatch, endBatch } =
    useCommandHistory<Model>(INITIAL, { limit: 20 });
  const [counters, setCounters] = useState<Counters>({ executed: 0, undone: 0, redone: 0 });

  const label = (item: Utterance, sentiment: Sentiment) => {
    execute(setLabelCommand(item, sentiment));
    setCounters((c) => ({ ...c, executed: c.executed + 1 }));
  };

  const type = (event: ChangeEvent<HTMLInputElement>) => {
    execute(typeNoteCommand(state.note, event.target.value));
    setCounters((c) => ({ ...c, executed: c.executed + 1 }));
  };

  const labelRemaining = () => {
    const remaining = state.items.filter((item) => item.label === null);
    if (remaining.length === 0) return;
    beginBatch();
    for (const item of remaining) execute(setLabelCommand(item, 'Neutral'));
    endBatch();
    setCounters((c) => ({ ...c, executed: c.executed + remaining.length }));
  };

  const onUndo = () => {
    undo();
    setCounters((c) => ({ ...c, undone: c.undone + 1 }));
  };

  const onRedo = () => {
    redo();
    setCounters((c) => ({ ...c, redone: c.redone + 1 }));
  };

  const remaining = state.items.filter((item) => item.label === null).length;

  return (
    <>
      <div className="demo-controls">
        <button onClick={onUndo} disabled={!canUndo}>
          Undo
        </button>
        <button onClick={onRedo} disabled={!canRedo}>
          Redo
        </button>
        <button onClick={labelRemaining} disabled={remaining === 0}>
          Batch: label all remaining as Neutral ({remaining})
        </button>
        <span className="demo-note">
          {counters.executed} commands executed · {counters.undone} undone · {counters.redone}{' '}
          redone · canUndo={String(canUndo)} · canRedo={String(canRedo)} · limit 20
        </span>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
        {state.items.map((item) => (
          <li
            key={item.id}
            style={{
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
              padding: '0.4rem 0',
              borderBottom: '1px solid #e5e7eb',
            }}
          >
            <span style={{ flex: 1 }}>{item.text}</span>
            <strong style={{ minWidth: '5rem' }}>{item.label ?? '—'}</strong>
            {SENTIMENTS.map((sentiment) => (
              <button
                key={sentiment}
                onClick={() => label(item, sentiment)}
                aria-pressed={item.label === sentiment}
                disabled={item.label === sentiment}
              >
                {sentiment}
              </button>
            ))}
          </li>
        ))}
      </ul>
      <label style={{ display: 'block', marginTop: '1rem' }}>
        Reviewer note (keystrokes coalesce as one &quot;typing&quot; entry){' '}
        <input value={state.note} onChange={type} style={{ width: '100%' }} />
      </label>
    </>
  );
}

export default function Demo() {
  return (
    <div className="demo">
      <h2>Command Stack Undo</h2>
      <p className="demo-note">
        Implement <code>useCommandHistory</code> in <code>use_command_history.ts</code> — a generic
        command-pattern history with coalescing by <code>mergeKey</code>, redo invalidation, an
        entry <code>limit</code> and batch transactions. This harness is a six-utterance sentiment
        labeler: repeated relabels of one row share <code>mergeKey=&quot;label:&lt;id&gt;&quot;</code>{' '}
        and undo in one step, typing in the note coalesces under{' '}
        <code>&quot;typing&quot;</code>, and the batch button wraps every remaining row in{' '}
        <code>beginBatch</code>/<code>endBatch</code> so one Undo reverts them all. History is
        capped at 20 entries.
      </p>
      <div className="demo-stage">
        <Labeler />
      </div>
    </div>
  );
}
