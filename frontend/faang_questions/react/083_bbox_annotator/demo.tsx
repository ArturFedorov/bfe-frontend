import { useState } from 'react';
import { BBoxAnnotator, Box, Point } from './bbox_annotator';

/**
 * Demo harness for BBoxAnnotator — auto-discovered by the playground
 * (playground/App.tsx). This file is not part of the task: the spec lives in
 * README.md and the grader is bbox_annotator.test.tsx.
 */

const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 800;
const VIEWPORT = { width: 600, height: 400 };
const ZOOM_STEPS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3];

const presetBoxes: Box[] = [
  { id: 'car', x: 140, y: 420, w: 360, h: 180 },
  { id: 'sign', x: 820, y: 120, w: 90, h: 140 },
];

// Placeholder "photo": a 1200×800 SVG with a sky/road gradient and a 100px
// grid so zoom and pan are visible without any image assets.
function placeholderImage(width: number, height: number): string {
  const lines: string[] = [];
  for (let x = 100; x < width; x += 100) {
    lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${height}" />`);
  }
  for (let y = 100; y < height; y += 100) {
    lines.push(`<line x1="0" y1="${y}" x2="${width}" y2="${y}" />`);
  }
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#bfdbfe"/><stop offset="0.6" stop-color="#e0e7ff"/>' +
    '<stop offset="0.6" stop-color="#6b7280"/><stop offset="1" stop-color="#374151"/>' +
    '</linearGradient></defs>' +
    `<rect width="${width}" height="${height}" fill="url(#g)"/>` +
    `<g stroke="#ffffff" stroke-opacity="0.35" stroke-width="2">${lines.join('')}</g>` +
    `<text x="${width / 2}" y="${height / 2}" text-anchor="middle" font-family="system-ui" font-size="48" fill="#1f2937" fill-opacity="0.5">${width} × ${height}</text>` +
    '</svg>';
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const imageUrl = placeholderImage(IMAGE_WIDTH, IMAGE_HEIGHT);

export default function Demo() {
  const [boxes, setBoxes] = useState<Box[]>(presetBoxes);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });

  // Zoom around the viewport centre so the image point under the centre stays
  // put — this is what makes `pan` change (and "Pan reset" meaningful).
  const zoomTo = (nextZoom: number) => {
    const cx = VIEWPORT.width / 2;
    const cy = VIEWPORT.height / 2;
    const ratio = nextZoom / zoom;
    setPan({ x: cx - (cx - pan.x) * ratio, y: cy - (cy - pan.y) * ratio });
    setZoom(nextZoom);
  };

  const stepZoom = (dir: -1 | 1) => {
    const i = ZOOM_STEPS.indexOf(zoom);
    const next = ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, Math.max(0, (i === -1 ? 3 : i) + dir))];
    if (next !== zoom) zoomTo(next);
  };

  const resetPan = () => setPan({ x: 0, y: 0 });

  return (
    <div className="demo">
      <h2>Bounding-Box Annotator</h2>
      <p className="demo-note">
        Implement <code>BBoxAnnotator</code>, <code>toImageSpace</code> and{' '}
        <code>clampBox</code> in <code>bbox_annotator.tsx</code> — an svg overlay
        for drawing, moving, resizing and nudging boxes, fully controlled through{' '}
        <code>value</code>/<code>onChange</code>, with every coordinate stored in
        image space. The &quot;image&quot; is a 1200×800 placeholder gradient drawn
        under a 600×400 viewport; zoom and pan move the backdrop and the svg
        group together, so the JSON readout below must not change when you zoom.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <button onClick={() => stepZoom(-1)} disabled={zoom === ZOOM_STEPS[0]}>
            Zoom −
          </button>
          <button onClick={() => zoomTo(1)} disabled={zoom === 1}>
            100%
          </button>
          <button onClick={() => stepZoom(1)} disabled={zoom === ZOOM_STEPS[ZOOM_STEPS.length - 1]}>
            Zoom +
          </button>
          <button onClick={resetPan} disabled={pan.x === 0 && pan.y === 0}>
            Pan reset
          </button>
          <button onClick={() => setBoxes([])} disabled={boxes.length === 0}>
            Clear boxes
          </button>
          <span className="demo-note">
            zoom {Math.round(zoom * 100)}% · pan ({Math.round(pan.x)}, {Math.round(pan.y)})
          </span>
        </div>
        <div
          style={{
            position: 'relative',
            width: VIEWPORT.width,
            height: VIEWPORT.height,
            marginTop: '1rem',
            overflow: 'hidden',
            border: '1px solid #e5e7eb',
            background: '#f3f4f6',
            userSelect: 'none',
            touchAction: 'none',
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: pan.x,
              top: pan.y,
              width: IMAGE_WIDTH * zoom,
              height: IMAGE_HEIGHT * zoom,
              backgroundImage: imageUrl,
              backgroundSize: '100% 100%',
              pointerEvents: 'none',
            }}
          />
          <div style={{ position: 'absolute', inset: 0 }}>
            <BBoxAnnotator
              imageWidth={IMAGE_WIDTH}
              imageHeight={IMAGE_HEIGHT}
              viewport={VIEWPORT}
              value={boxes}
              onChange={setBoxes}
              zoom={zoom}
              pan={pan}
            />
          </div>
        </div>
        <p className="demo-note">
          Drag on empty canvas to draw, drag a box to move, drag a handle to
          resize, Escape cancels; focus a box and use arrows (Shift = 10px) or
          Delete. Boxes in image space:
        </p>
        <pre className="demo-note">{JSON.stringify(boxes, null, 2)}</pre>
      </div>
    </div>
  );
}
