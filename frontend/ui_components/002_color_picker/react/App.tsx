import ColorPicker from './ColorPicker';

/**
 * Demo harness for Color Picker.
 *
 * Tweak the sample props below as you build the component out. This file is
 * auto-discovered by the playground router (../../src/App.tsx).
 */
export default function App() {
  return (
    <div className="demo">
      <h2>Color Picker</h2>
      <p className="demo-note">
        Implement <code>ColorPicker</code> in <code>ColorPicker.tsx</code>. The full
        requirements live in this folder&apos;s <code>README.md</code>.
      </p>
      <div className="demo-stage">
        <ColorPicker />
      </div>
    </div>
  );
}
