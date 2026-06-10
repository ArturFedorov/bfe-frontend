import Accordion from './Accordion';

/**
 * Demo harness for Accordion.
 *
 * Tweak the sample props below as you build the component out. This file is
 * auto-discovered by the playground router (../../src/App.tsx).
 */
export default function App() {
  return (
    <div className="demo">
      <h2>Accordion</h2>
      <p className="demo-note">
        Implement <code>Accordion</code> in <code>Accordion.tsx</code>. The full
        requirements live in this folder&apos;s <code>README.md</code>.
      </p>
      <div className="demo-stage">
        <Accordion />
      </div>
    </div>
  );
}
