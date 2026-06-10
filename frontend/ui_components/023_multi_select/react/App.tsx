import MultiSelect from './MultiSelect';

/**
 * Demo harness for Multi-Select Dropdown.
 *
 * Tweak the sample props below as you build the component out. This file is
 * auto-discovered by the playground router (../../src/App.tsx).
 */
export default function App() {
  return (
    <div className="demo">
      <h2>Multi-Select Dropdown</h2>
      <p className="demo-note">
        Implement <code>MultiSelect</code> in <code>MultiSelect.tsx</code>. The full
        requirements live in this folder&apos;s <code>README.md</code>.
      </p>
      <div className="demo-stage">
        <MultiSelect />
      </div>
    </div>
  );
}
