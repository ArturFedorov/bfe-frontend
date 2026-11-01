import { SelectableTable, type Row } from './row_selection_state';

/**
 * Demo harness for row selection — auto-discovered by the playground
 * (playground/App.tsx). 25 sample jobs across 3 pages; the reducer and
 * SelectableTable in row_selection_state.tsx are the task.
 */

const JOBS: readonly Row[] = Array.from({ length: 25 }, (_, i) => ({
  id: `job-${i + 1}`,
  name: `Delivery job ${i + 1}`,
}));

export default function Demo() {
  return (
    <div className="demo">
      <h2>Row Selection State</h2>
      <p className="demo-note">
        Implement <code>selectionReducer</code>, <code>getHeaderState</code> and{' '}
        <code>SelectableTable</code> in <code>row_selection_state.tsx</code>. Things to verify by
        hand: the header checkbox goes indeterminate when only some visible rows are checked;
        &quot;Select page&quot; only touches the visible page while &quot;Select all 25&quot;
        spans every page; selections survive paging away and back.
      </p>
      <div className="demo-stage">
        <SelectableTable rows={JOBS} pageSize={10} />
      </div>
    </div>
  );
}
