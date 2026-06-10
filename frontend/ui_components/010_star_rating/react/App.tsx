import StarRating from './StarRating';

/**
 * Demo harness for Star Rating.
 *
 * Tweak the sample props below as you build the component out. This file is
 * auto-discovered by the playground router (../../src/App.tsx).
 */
export default function App() {
  return (
    <div className="demo">
      <h2>Star Rating</h2>
      <p className="demo-note">
        Implement <code>StarRating</code> in <code>StarRating.tsx</code>. The full
        requirements live in this folder&apos;s <code>README.md</code>.
      </p>
      <div className="demo-stage">
        <StarRating />
      </div>
    </div>
  );
}
