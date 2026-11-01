import { useUndoState } from './use_undo_state';

/**
 * Demo harness for useUndoState — auto-discovered by the playground.
 * A delivery-rule editor with full undo/redo. Edit, undo a few steps, then
 * type again: the redo branch must be discarded, exactly like a text editor.
 */
const PRESETS = [
  'route region=EMEA to encoder-pool-2',
  'reject codec=prores when partner=p-200',
  'hold delivery when qc-status=pending',
];

function RuleEditor() {
  const { state, set, undo, redo, canUndo, canRedo } = useUndoState('');

  return (
    <div>
      <textarea
        aria-label="Rule body"
        rows={4}
        style={{ width: '100%' }}
        value={state}
        onChange={(e) => set(e.target.value)}
        placeholder="Type a routing rule — every edit is an undoable step…"
      />
      <div className="demo-controls">
        <button onClick={undo} disabled={!canUndo}>
          Undo
        </button>
        <button onClick={redo} disabled={!canRedo}>
          Redo
        </button>
        <button onClick={() => set((prev) => prev.toUpperCase())} disabled={state === ''}>
          Uppercase (functional set)
        </button>
        {PRESETS.map((rule) => (
          <button key={rule} onClick={() => set(rule)}>
            Insert: {rule.split(' ')[0]} rule
          </button>
        ))}
      </div>
      <p>
        canUndo: <code>{String(canUndo)}</code> — canRedo:{' '}
        <code>{String(canRedo)}</code>
      </p>
      <p>
        Undo a few steps, then make a new edit — Redo must go dark (the future
        branch is discarded).
      </p>
    </div>
  );
}

export default function Demo() {
  return (
    <div className="demo">
      <h2>useUndoState</h2>
      <p className="demo-note">
        Implement <code>useUndoState</code> in <code>use_undo_state.ts</code> —
        the past/present/future undo model as a hook, with stable{' '}
        <code>set</code>/<code>undo</code>/<code>redo</code> identities and a
        new edit after undo clearing the future.
      </p>
      <div className="demo-stage">
        <RuleEditor />
      </div>
    </div>
  );
}
