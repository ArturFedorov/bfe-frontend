import DragAndDrop from './DragAndDrop';

/**
 * Demo harness for Drag and Drop Sortable List.
 *
 * Tweak the sample props below as you build the component out. This file is
 * auto-discovered by the playground router (../../src/App.tsx).
 */
export default function App() {
  return (
    <div className="demo">
      <h2>Drag and Drop Sortable List</h2>
      <p className="demo-note">
        Implement <code>DragAndDrop</code> in <code>DragAndDrop.tsx</code>. The full
        requirements live in this folder&apos;s <code>README.md</code>.
      </p>
      <div className="demo-stage">
        <DragAndDrop />
      </div>
    </div>
  );
}
