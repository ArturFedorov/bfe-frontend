import KanbanBoard from './KanbanBoard';

/**
 * Demo harness for Kanban Board.
 *
 * Tweak the sample props below as you build the component out. This file is
 * auto-discovered by the playground router (../../src/App.tsx).
 */
export default function App() {
  return (
    <div className="demo">
      <h2>Kanban Board</h2>
      <p className="demo-note">
        Implement <code>KanbanBoard</code> in <code>KanbanBoard.tsx</code>. The full
        requirements live in this folder&apos;s <code>README.md</code>.
      </p>
      <div className="demo-stage">
        <KanbanBoard />
      </div>
    </div>
  );
}
