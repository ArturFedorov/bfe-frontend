import InfiniteScroll from './InfiniteScroll';

/**
 * Demo harness for Infinite Scroll.
 *
 * Tweak the sample props below as you build the component out. This file is
 * auto-discovered by the playground router (../../src/App.tsx).
 */
export default function App() {
  return (
    <div className="demo">
      <h2>Infinite Scroll</h2>
      <p className="demo-note">
        Implement <code>InfiniteScroll</code> in <code>InfiniteScroll.tsx</code>. The full
        requirements live in this folder&apos;s <code>README.md</code>.
      </p>
      <div className="demo-stage">
        <InfiniteScroll />
      </div>
    </div>
  );
}
