import { FilterBar } from './filter_reducer';

/**
 * Demo harness for the filter reducer — auto-discovered by the playground
 * (playground/App.tsx). This file is not part of the task: the spec lives in
 * README.md and the grader is filter_reducer.test.tsx.
 */
export default function Demo() {
  return (
    <div className="demo">
      <h2>Filter Reducer</h2>
      <p className="demo-note">
        Implement <code>createInitialFilterState</code>, <code>filterReducer</code> and{' '}
        <code>FilterBar</code> in <code>filter_reducer.tsx</code> — one <code>useReducer</code>,
        controlled inputs, and a &quot;Clear all&quot; that restores the defaults the state was
        created with.
      </p>
      <div className="demo-stage">
        <h3>Built-in defaults</h3>
        <p className="demo-note">
          Clear all should reset to <code>all / all / &quot;&quot;</code>.
        </p>
        <FilterBar />

        <h3>Custom defaults</h3>
        <p className="demo-note">
          This bar was created with <code>active / emea</code> defaults — change every filter,
          then hit Clear all and verify it restores <em>these</em> defaults, not the built-ins.
        </p>
        <FilterBar
          defaults={{ status: 'active', region: 'emea', search: '' }}
          statusOptions={['all', 'active', 'paused']}
          regionOptions={['all', 'amer', 'emea', 'apac']}
        />
      </div>
    </div>
  );
}
