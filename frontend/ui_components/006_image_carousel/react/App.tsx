import ImageCarousel from './ImageCarousel';

/**
 * Demo harness for Image Carousel.
 *
 * Tweak the sample props below as you build the component out. This file is
 * auto-discovered by the playground router (../../src/App.tsx).
 */
export default function App() {
  return (
    <div className="demo">
      <h2>Image Carousel</h2>
      <p className="demo-note">
        Implement <code>ImageCarousel</code> in <code>ImageCarousel.tsx</code>. The full
        requirements live in this folder&apos;s <code>README.md</code>.
      </p>
      <div className="demo-stage">
        <ImageCarousel />
      </div>
    </div>
  );
}
