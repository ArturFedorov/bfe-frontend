import Calendar from './Calendar';

/**
 * Demo harness for Calendar.
 *
 * Tweak the sample props below as you build the component out. This file is
 * auto-discovered by the playground router (../../src/App.tsx).
 */
export default function App() {
  return (
    <div className="demo">
      <h2>Calendar</h2>
      <p className="demo-note">
        Implement <code>Calendar</code> in <code>Calendar.tsx</code>. The full
        requirements live in this folder&apos;s <code>README.md</code>.
      </p>
      <div className="demo-stage">
        <Calendar />
      </div>
    </div>
  );
}
