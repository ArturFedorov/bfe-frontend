import { useReducer, useState } from 'react';
import { canRedo, canUndo, createHistoryState, withUndoRedo } from './undo_redo_reducer';

/**
 * Demo harness for the undo/redo higher-order reducer — auto-discovered by the
 * playground (playground/App.tsx). The base tag reducer below is demo-only
 * plumbing; the task is the generic wrapper in undo_redo_reducer.ts.
 */

type TagAction = { type: 'add'; tag: string } | { type: 'remove'; tag: string };

// Base reducer returns the SAME reference for no-ops (duplicate add, unknown
// remove) — the wrapper must not record history entries for those.
function tagsReducer(tags: readonly string[], action: TagAction): readonly string[] {
  switch (action.type) {
    case 'add': {
      const tag = action.tag.trim();
      if (tag === '' || tags.includes(tag)) return tags;
      return [...tags, tag];
    }
    case 'remove':
      if (!tags.includes(action.tag)) return tags;
      return tags.filter((t) => t !== action.tag);
  }
}

const historyTagsReducer = withUndoRedo(tagsReducer);

export default function Demo() {
  const [state, dispatch] = useReducer(historyTagsReducer, undefined, () =>
    createHistoryState<readonly string[]>(['drama', 'comedy']),
  );
  const [draft, setDraft] = useState('');

  const addDraft = () => {
    dispatch({ type: 'add', tag: draft });
    setDraft('');
  };

  return (
    <div className="demo">
      <h2>Undo/Redo Reducer</h2>
      <p className="demo-note">
        Implement <code>withUndoRedo</code> in <code>undo_redo_reducer.ts</code>. This tag editor
        uses the wrapped reducer: add/remove tags, then Undo/Redo. Adding a duplicate tag is a
        base-level no-op and must not create a history entry; a new edit after Undo discards the
        redo stack; Checkpoint wipes both stacks.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <label>
            New tag{' '}
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addDraft();
              }}
            />
          </label>
          <button onClick={addDraft}>Add tag</button>
        </div>

        <div className="demo-controls">
          {state.present.length === 0 && <em>No tags — undo to bring some back.</em>}
          {state.present.map((tag) => (
            <span
              key={tag}
              style={{
                background: '#f3f4f6',
                borderRadius: 999,
                padding: '0.2rem 0.6rem',
                fontSize: '0.85rem',
              }}
            >
              {tag}{' '}
              <button
                aria-label={`Remove ${tag}`}
                onClick={() => dispatch({ type: 'remove', tag })}
                style={{ border: 'none', background: 'none', cursor: 'pointer' }}
              >
                ×
              </button>
            </span>
          ))}
        </div>

        <div className="demo-controls">
          <button disabled={!canUndo(state)} onClick={() => dispatch({ type: 'undo' })}>
            Undo
          </button>
          <button disabled={!canRedo(state)} onClick={() => dispatch({ type: 'redo' })}>
            Redo
          </button>
          <button onClick={() => dispatch({ type: 'checkpoint' })}>Checkpoint (save)</button>
          <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
            past: {state.past.length} · future: {state.future.length}
          </span>
        </div>
      </div>
    </div>
  );
}
