import { useState } from 'react';
import { Carousel, type Slide } from './carousel';

/**
 * Demo harness for Carousel — auto-discovered by the playground
 * (playground/App.tsx). Not part of the task: the spec lives in README.md and
 * the grader is carousel.test.tsx.
 */

const HUES = [210, 340, 40, 150, 280, 20];

const svg = (i: number) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="hsl(${HUES[i % HUES.length]},60%,45%)"/><text x="50%" y="50%" fill="white" font-family="sans-serif" font-size="64" text-anchor="middle" dominant-baseline="middle">Key art ${i + 1}</text></svg>`,
  )}`;

const SLIDES: Slide[] = Array.from({ length: 6 }, (_, i) => ({
  id: `art-${i + 1}`,
  src: svg(i),
  alt: `Key art ${i + 1}`,
}));

export default function Demo() {
  const [autoPlay, setAutoPlay] = useState(true);
  const [loop, setLoop] = useState(true);
  const [last, setLast] = useState<number | null>(null);

  return (
    <div className="demo">
      <h2>Image Carousel</h2>
      <p className="demo-note">
        Implement <code>Carousel</code> in <code>carousel.tsx</code>: a WAI-ARIA carousel region
        with one visible slide, Previous / Next, dots with <code>aria-current</code>, a{' '}
        <code>role=&quot;status&quot;</code> line, <kbd>←</kbd>/<kbd>→</kbd> on the region, autoplay
        that pauses on hover and focus, lazy rendering of the active slide ± 1 (check the Elements
        panel: never more than three <code>&lt;img&gt;</code>), and a 40px pointer swipe.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <label>
            <input type="checkbox" checked={autoPlay} onChange={(e) => setAutoPlay(e.target.checked)} />{' '}
            Autoplay (2.5s)
          </label>
          <label>
            <input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} /> Loop
          </label>
        </div>
        <Carousel
          key={`${autoPlay}-${loop}`}
          slides={SLIDES}
          autoPlayMs={autoPlay ? 2500 : 0}
          loop={loop}
          onChange={setLast}
        />
        <p className="demo-note">
          Last onChange: {last === null ? 'none yet' : `index ${last}`}. Hover or focus the gallery to
          pause autoplay.
        </p>
      </div>
    </div>
  );
}
