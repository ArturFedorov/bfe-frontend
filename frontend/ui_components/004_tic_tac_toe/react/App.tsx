import TicTacToe from './TicTacToe';

/**
 * Demo harness for Tic-Tac-Toe.
 *
 * Tweak the sample props below as you build the component out. This file is
 * auto-discovered by the playground router (../../src/App.tsx).
 */
export default function App() {
  return (
    <div className="demo">
      <h2>Tic-Tac-Toe</h2>
      <p className="demo-note">
        Implement <code>TicTacToe</code> in <code>TicTacToe.tsx</code>. The full
        requirements live in this folder&apos;s <code>README.md</code>.
      </p>
      <div className="demo-stage">
        <TicTacToe />
      </div>
    </div>
  );
}
