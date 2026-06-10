import VirtualScroll from './VirtualScroll';

/**
 * Demo harness for Virtual Scroll List.
 *
 * Tweak the sample props below as you build the component out. This file is
 * auto-discovered by the playground router (../../src/App.tsx).
 */
export default function App() {
  return (
    <div className="demo">
      <h2>Virtual Scroll List</h2>
      <p className="demo-note">
        Implement <code>VirtualScroll</code> in <code>VirtualScroll.tsx</code>. The full
        requirements live in this folder&apos;s <code>README.md</code>.
      </p>
      <div className="demo-stage">
        <VirtualScroll />
      </div>
    </div>
  );
}
