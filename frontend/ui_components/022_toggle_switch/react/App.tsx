import ToggleSwitch from './ToggleSwitch';

/**
 * Demo harness for Toggle Switch.
 *
 * Tweak the sample props below as you build the component out. This file is
 * auto-discovered by the playground router (../../src/App.tsx).
 */
export default function App() {
  return (
    <div className="demo">
      <h2>Toggle Switch</h2>
      <p className="demo-note">
        Implement <code>ToggleSwitch</code> in <code>ToggleSwitch.tsx</code>. The full
        requirements live in this folder&apos;s <code>README.md</code>.
      </p>
      <div className="demo-stage">
        <ToggleSwitch />
      </div>
    </div>
  );
}
