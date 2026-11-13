import React, { ReactElement, useEffect, useRef, useState } from 'react';

export interface Point {
  x: number;
  y: number;
}

/** A bounding box in IMAGE space (pixels of the source image, independent of zoom/pan). */
export interface Box {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export type Handle = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

export interface BBoxAnnotatorProps {
  imageWidth: number;
  imageHeight: number;
  viewport: { width: number; height: number };
  value: Box[];
  onChange: (next: Box[]) => void;
  /** Screen px per image px. Default 1. */
  zoom?: number;
  /** Screen-space offset of the image origin inside the viewport. Default { x: 0, y: 0 }. */
  pan?: Point;
  /** Id factory for newly drawn boxes. Default: `box-1`, `box-2`, … */
  createId?: () => string;
}

const HANDLES: Handle[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
/** Handle size in SCREEN px (divided by zoom so it stays constant on screen). */
const HANDLE_PX = 8;
/** Drafts narrower or shorter than this (image px) are discarded. */
const MIN_SIZE = 2;

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

// ---------------------------------------------------------------------------
// Pure helpers (no DOM access)
// ---------------------------------------------------------------------------

/** Convert a point in screen space (relative to the svg origin) into image space. */
export function toImageSpace(point: Point, zoom: number, pan: Point): Point {
  return { x: (point.x - pan.x) / zoom, y: (point.y - pan.y) / zoom };
}

/** Keep a box (non-negative size) fully inside the image bounds. */
export function clampBox(box: Box, imageWidth: number, imageHeight: number): Box {
  // 1. cap the size to the image, 2. slide the position so the box fits inside.
  const w = clamp(box.w, 0, imageWidth);
  const h = clamp(box.h, 0, imageHeight);
  return {
    ...box,
    w,
    h,
    x: clamp(box.x, 0, imageWidth - w),
    y: clamp(box.y, 0, imageHeight - h),
  };
}

/** Build a normalised box (positive size) from two opposite corners. */
function boxFromCorners(id: string, a: Point, b: Point): Box {
  return {
    id,
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(a.x - b.x),
    h: Math.abs(a.y - b.y),
  };
}

// ---------------------------------------------------------------------------
// Drag state — transient, kept in a ref so pointer handlers never read stale
// closures. Only the draft (needed for rendering) is mirrored into state.
// ---------------------------------------------------------------------------

type Drag =
  | { kind: 'draw'; pointerId: number; start: Point }
  | { kind: 'move'; pointerId: number; id: string; original: Box; start: Point }
  | { kind: 'resize'; pointerId: number; id: string; original: Box; start: Point; handle: Handle };

/**
 * SVG bounding-box annotator.
 *
 * - Fully controlled: renders exactly `value`; every edit is proposed through
 *   `onChange`. The only internal state is the selected id, the in-progress
 *   draft and the transient drag descriptor.
 * - Zoom/pan are applied with a `<g transform>`; boxes keep image-space coords.
 * - Every pointer event is converted screen → image via the svg's bounding
 *   rect plus `toImageSpace`, so a drag lands on the same pixels at any zoom.
 */
export function BBoxAnnotator({
  imageWidth,
  imageHeight,
  viewport,
  value,
  onChange,
  zoom = 1,
  pan = { x: 0, y: 0 },
  createId,
}: BBoxAnnotatorProps): ReactElement {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const idCounter = useRef(0);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Box | null>(null);

  // Selection is derived from `value` so a deleted/removed box is never "selected".
  const selectedBox = value.find((b) => b.id === selectedId) ?? null;

  const nextId = () => {
    if (createId) return createId();
    idCounter.current += 1;
    return `box-${idCounter.current}`;
  };

  /** Pointer event → image-space point, using the svg origin and current zoom/pan. */
  const pointOf = (e: React.PointerEvent): Point => {
    const rect = svgRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 };
    return toImageSpace({ x: e.clientX - rect.left, y: e.clientY - rect.top }, zoom, pan);
  };

  /** Clamp a point to the image rectangle (used for draw/resize edges). */
  const clampPoint = (p: Point): Point => ({
    x: clamp(p.x, 0, imageWidth),
    y: clamp(p.y, 0, imageHeight),
  });

  const beginDrag = (e: React.PointerEvent, drag: Drag) => {
    dragRef.current = drag;
    svgRef.current?.setPointerCapture(e.pointerId);
  };

  const endDrag = () => {
    const drag = dragRef.current;
    if (drag) svgRef.current?.releasePointerCapture(drag.pointerId);
    dragRef.current = null;
    setDraft(null);
  };

  /** Escape / pointercancel: restore the pre-drag box, drop the draft, ignore later events. */
  const cancelDrag = () => {
    const drag = dragRef.current;
    if (!drag) return;
    if (drag.kind !== 'draw') {
      onChange(value.map((b) => (b.id === drag.id ? drag.original : b)));
    }
    endDrag();
  };

  // Release the capture if we unmount mid-drag.
  useEffect(() => () => endDrag(), []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- pointer handlers -----------------------------------------------------

  const onCanvasPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    // Boxes and handles handle their own pointerdown (events bubble up here).
    const target = e.target as Element;
    if (target !== e.currentTarget && !target.hasAttribute('data-background')) return;
    if (dragRef.current) return;
    setSelectedId(null);
    beginDrag(e, { kind: 'draw', pointerId: e.pointerId, start: clampPoint(pointOf(e)) });
  };

  const onBoxPointerDown = (e: React.PointerEvent<SVGRectElement>, box: Box) => {
    if (dragRef.current) return;
    setSelectedId(box.id);
    beginDrag(e, { kind: 'move', pointerId: e.pointerId, id: box.id, original: box, start: pointOf(e) });
  };

  const onHandlePointerDown = (e: React.PointerEvent<SVGRectElement>, box: Box, handle: Handle) => {
    if (dragRef.current) return;
    setSelectedId(box.id);
    beginDrag(e, {
      kind: 'resize',
      pointerId: e.pointerId,
      id: box.id,
      original: box,
      start: pointOf(e),
      handle,
    });
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const point = pointOf(e);

    switch (drag.kind) {
      case 'draw': {
        // Draft only — nothing is committed until pointerup.
        setDraft(boxFromCorners('draft', drag.start, clampPoint(point)));
        return;
      }
      case 'move': {
        const dx = point.x - drag.start.x;
        const dy = point.y - drag.start.y;
        const moved = clampBox(
          { ...drag.original, x: drag.original.x + dx, y: drag.original.y + dy },
          imageWidth,
          imageHeight
        );
        onChange(value.map((b) => (b.id === drag.id ? moved : b)));
        return;
      }
      case 'resize': {
        const dx = point.x - drag.start.x;
        const dy = point.y - drag.start.y;
        const o = drag.original;
        // Move only the edges named by the handle; clamp each edge to the image,
        // then normalise so dragging past the opposite edge flips the box.
        let left = o.x;
        let right = o.x + o.w;
        let top = o.y;
        let bottom = o.y + o.h;
        if (drag.handle.includes('w')) left = clamp(left + dx, 0, imageWidth);
        if (drag.handle.includes('e')) right = clamp(right + dx, 0, imageWidth);
        if (drag.handle.includes('n')) top = clamp(top + dy, 0, imageHeight);
        if (drag.handle.includes('s')) bottom = clamp(bottom + dy, 0, imageHeight);
        const resized = clampBox(
          boxFromCorners(o.id, { x: left, y: top }, { x: right, y: bottom }),
          imageWidth,
          imageHeight
        );
        onChange(value.map((b) => (b.id === drag.id ? resized : b)));
        return;
      }
    }
  };

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    if (drag.kind === 'draw') {
      const box = boxFromCorners(nextId(), drag.start, clampPoint(pointOf(e)));
      if (box.w >= MIN_SIZE && box.h >= MIN_SIZE) {
        onChange([...value, clampBox(box, imageWidth, imageHeight)]);
        setSelectedId(box.id);
      }
    }
    // Move/resize already pushed every intermediate box through onChange.
    endDrag();
  };

  // --- keyboard -------------------------------------------------------------

  const onKeyDown = (e: React.KeyboardEvent<SVGSVGElement>) => {
    if (e.key === 'Escape') {
      if (dragRef.current) {
        e.preventDefault();
        cancelDrag();
      }
      return;
    }
    if (!selectedBox) return;

    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      onChange(value.filter((b) => b.id !== selectedBox.id));
      setSelectedId(null);
      return;
    }

    const step = e.shiftKey ? 10 : 1;
    const delta: Record<string, Point> = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step },
    };
    const d = delta[e.key];
    if (!d) return;
    e.preventDefault();
    const nudged = clampBox(
      { ...selectedBox, x: selectedBox.x + d.x, y: selectedBox.y + d.y },
      imageWidth,
      imageHeight
    );
    onChange(value.map((b) => (b.id === selectedBox.id ? nudged : b)));
  };

  // --- render ---------------------------------------------------------------

  const handleSize = HANDLE_PX / zoom;

  const handlePosition = (box: Box, handle: Handle): Point => {
    const cx = handle.includes('w') ? box.x : handle.includes('e') ? box.x + box.w : box.x + box.w / 2;
    const cy = handle.includes('n') ? box.y : handle.includes('s') ? box.y + box.h : box.y + box.h / 2;
    return { x: cx - handleSize / 2, y: cy - handleSize / 2 };
  };

  return (
    <svg
      ref={svgRef}
      role="application"
      aria-label="Bounding boxes"
      tabIndex={0}
      width={viewport.width}
      height={viewport.height}
      style={{ touchAction: 'none', userSelect: 'none' }}
      onPointerDown={onCanvasPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={cancelDrag}
      onKeyDown={onKeyDown}
    >
      {/* zoom/pan live here — box coordinates below stay in image space */}
      <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
        <rect data-background x={0} y={0} width={imageWidth} height={imageHeight} fill="#eee" />

        {value.map((box) => (
          <rect
            key={box.id}
            role="button"
            aria-label={`Box ${box.id}`}
            tabIndex={0}
            x={box.x}
            y={box.y}
            width={box.w}
            height={box.h}
            fill={box.id === selectedId ? 'rgba(0,120,255,0.25)' : 'rgba(0,120,255,0.1)'}
            stroke="#0078ff"
            strokeWidth={1 / zoom}
            onPointerDown={(e) => onBoxPointerDown(e, box)}
            onFocus={() => setSelectedId(box.id)}
          />
        ))}

        {selectedBox &&
          HANDLES.map((handle) => {
            const p = handlePosition(selectedBox, handle);
            return (
              <rect
                key={handle}
                role="button"
                aria-label={`Resize Box ${selectedBox.id} ${handle}`}
                data-handle={handle}
                x={p.x}
                y={p.y}
                width={handleSize}
                height={handleSize}
                fill="#fff"
                stroke="#0078ff"
                strokeWidth={1 / zoom}
                style={{ cursor: `${handle}-resize` }}
                onPointerDown={(e) => onHandlePointerDown(e, selectedBox, handle)}
              />
            );
          })}

        {draft && (
          <rect
            aria-hidden="true"
            x={draft.x}
            y={draft.y}
            width={draft.w}
            height={draft.h}
            fill="rgba(0,120,255,0.15)"
            stroke="#0078ff"
            strokeDasharray={`${4 / zoom} ${2 / zoom}`}
            strokeWidth={1 / zoom}
            pointerEvents="none"
          />
        )}
      </g>
    </svg>
  );
}
