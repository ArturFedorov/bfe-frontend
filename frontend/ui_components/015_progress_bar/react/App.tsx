import ProgressBar from './ProgressBar';

/**
 * Demo harness for Progress Bar.
 *
 * Tweak the sample props below as you build the component out. This file is
 * auto-discovered by the playground router (../../src/App.tsx).
 */
export default function App() {
  return (
    <div className="demo">
      <h2>Progress Bar</h2>
      <p className="demo-note">
        Implement <code>ProgressBar</code> in <code>ProgressBar.tsx</code>. The full
        requirements live in this folder&apos;s <code>README.md</code>.
      </p>
      <div className="demo-stage">
        <ProgressBar />
      </div>
    </div>
  );
}
