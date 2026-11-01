/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { BBoxAnnotator, BBoxAnnotatorProps, Box, clampBox, toImageSpace } from './bbox_annotator';

// jsdom 20 has neither PointerEvent nor pointer capture. Both are browser boundaries, so we
// polyfill the event class on top of MouseEvent and stub the capture methods.
beforeAll(() => {
  if (typeof window.PointerEvent === 'undefined') {
    class PointerEventPolyfill extends MouseEvent {
      pointerId: number;
      pointerType: string;
      isPrimary: boolean;
      constructor(type: string, init: PointerEventInit = {}) {
        super(type, init);
        this.pointerId = init.pointerId ?? 1;
        this.pointerType = init.pointerType ?? 'mouse';
        this.isPrimary = init.isPrimary ?? true;
      }
    }
    (window as unknown as { PointerEvent: unknown }).PointerEvent = PointerEventPolyfill;
  }
});

let setCapture: jest.Mock;
let releaseCapture: jest.Mock;
beforeEach(() => {
  setCapture = jest.fn();
  releaseCapture = jest.fn();
  Element.prototype.setPointerCapture = setCapture;
  Element.prototype.releasePointerCapture = releaseCapture;
});

const ORIGIN = { left: 100, top: 50 };
const IMAGE = { imageWidth: 200, imageHeight: 100 };
const VIEWPORT = { width: 400, height: 300 };

function Harness(props: Partial<BBoxAnnotatorProps> & { initial?: Box[]; onChangeSpy?: jest.Mock }) {
  const { initial = [], onChangeSpy, ...rest } = props;
  const [value, setValue] = useState<Box[]>(initial);
  return (
    <BBoxAnnotator
      {...IMAGE}
      viewport={VIEWPORT}
      value={value}
      onChange={(next) => {
        onChangeSpy?.(next);
        setValue(next);
      }}
      {...rest}
    />
  );
}

function canvas(): SVGSVGElement {
  const svg = screen.getByRole('application', { name: 'Bounding boxes' }) as unknown as SVGSVGElement;
  svg.getBoundingClientRect = () =>
    ({ ...ORIGIN, x: ORIGIN.left, y: ORIGIN.top, width: VIEWPORT.width, height: VIEWPORT.height, right: ORIGIN.left + VIEWPORT.width, bottom: ORIGIN.top + VIEWPORT.height, toJSON: () => ({}) }) as DOMRect;
  return svg;
}

/** Screen-space point relative to the svg origin → clientX/clientY. */
const at = (x: number, y: number, extra: Record<string, unknown> = {}) => ({
  clientX: ORIGIN.left + x,
  clientY: ORIGIN.top + y,
  pointerId: 1,
  button: 0,
  ...extra,
});

function drag(from: Element, start: [number, number], end: [number, number], svg: Element) {
  fireEvent.pointerDown(from, at(...start));
  fireEvent.pointerMove(svg, at(...end));
  fireEvent.pointerUp(svg, at(...end));
}

const box = (el: HTMLElement) => ({
  x: Number(el.getAttribute('x')),
  y: Number(el.getAttribute('y')),
  w: Number(el.getAttribute('width')),
  h: Number(el.getAttribute('height')),
});

const boxA: Box = { id: 'a', x: 10, y: 10, w: 40, h: 20 };

describe('pure helpers', () => {
  it('toImageSpace is the identity at zoom 1 with no pan', () => {
    expect(toImageSpace({ x: 30, y: 40 }, 1, { x: 0, y: 0 })).toEqual({ x: 30, y: 40 });
  });

  it('toImageSpace removes the pan and divides by zoom', () => {
    expect(toImageSpace({ x: 110, y: 70 }, 2, { x: 10, y: 20 })).toEqual({ x: 50, y: 25 });
    expect(toImageSpace({ x: 0, y: 0 }, 0.5, { x: 10, y: 10 })).toEqual({ x: -20, y: -20 });
  });

  it('clampBox leaves a box inside the image untouched', () => {
    expect(clampBox(boxA, 200, 100)).toEqual(boxA);
  });

  it('clampBox shifts a box back inside and shrinks one larger than the image', () => {
    expect(clampBox({ id: 'b', x: 180, y: -5, w: 40, h: 20 }, 200, 100)).toEqual({ id: 'b', x: 160, y: 0, w: 40, h: 20 });
    expect(clampBox({ id: 'c', x: 10, y: 10, w: 500, h: 500 }, 200, 100)).toEqual({ id: 'c', x: 0, y: 0, w: 200, h: 100 });
  });
});

describe('rendering', () => {
  it('renders an svg application with one button rect per box, positioned in image space', () => {
    render(<Harness initial={[boxA, { id: 'b', x: 100, y: 50, w: 20, h: 20 }]} />);
    const svg = canvas();
    expect(svg.tagName.toLowerCase()).toBe('svg');
    const a = screen.getByRole('button', { name: 'Box a' });
    expect(box(a)).toEqual({ x: 10, y: 10, w: 40, h: 20 });
    expect(screen.getByRole('button', { name: 'Box b' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Box / })).toHaveLength(2);
  });

  it('applies zoom and pan through a group transform, not by rewriting box coordinates', () => {
    render(<Harness initial={[boxA]} zoom={2} pan={{ x: 10, y: 20 }} />);
    const g = canvas().querySelector('g');
    expect(g?.getAttribute('transform')).toMatch(/translate\(10[ ,]+20\)/);
    expect(g?.getAttribute('transform')).toMatch(/scale\(2\)/);
    expect(box(screen.getByRole('button', { name: 'Box a' }))).toEqual({ x: 10, y: 10, w: 40, h: 20 });
  });

  it('shows the 8 resize handles only for the selected box', () => {
    render(<Harness initial={[boxA]} />);
    const svg = canvas();
    expect(svg.querySelectorAll('[data-handle]')).toHaveLength(0);

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Box a' }), at(20, 20));
    fireEvent.pointerUp(svg, at(20, 20));

    const handles = Array.from(svg.querySelectorAll('[data-handle]')).map((h) => h.getAttribute('data-handle'));
    expect(handles.sort()).toEqual(['e', 'n', 'ne', 'nw', 's', 'se', 'sw', 'w']);
    expect(screen.getByRole('button', { name: 'Resize Box a se' })).toBeInTheDocument();
  });
});

describe('drawing a new box', () => {
  it('pointerdown on empty canvas + move + up adds a box in image space and captures the pointer', () => {
    const onChange = jest.fn();
    render(<Harness onChangeSpy={onChange} />);
    const svg = canvas();

    fireEvent.pointerDown(svg, at(20, 30));
    expect(setCapture).toHaveBeenCalledWith(1);
    fireEvent.pointerMove(svg, at(60, 50));
    expect(onChange).not.toHaveBeenCalled(); // draft only — nothing committed yet
    fireEvent.pointerUp(svg, at(60, 50));

    expect(onChange).toHaveBeenCalledTimes(1);
    const [next] = onChange.mock.calls[0] as [Box[]];
    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject({ x: 20, y: 30, w: 40, h: 20 });
    expect(typeof next[0].id).toBe('string');
    expect(releaseCapture).toHaveBeenCalledWith(1);
    expect(screen.getAllByRole('button', { name: /^Box / })).toHaveLength(1);
  });

  it('normalizes a drag made towards the top-left', () => {
    const onChange = jest.fn();
    render(<Harness onChangeSpy={onChange} />);
    const svg = canvas();
    drag(svg, [60, 50], [20, 30], svg);
    expect(onChange.mock.calls[0][0][0]).toMatchObject({ x: 20, y: 30, w: 40, h: 20 });
  });

  it('discards a drag smaller than 2px in either dimension', () => {
    const onChange = jest.fn();
    render(<Harness onChangeSpy={onChange} />);
    const svg = canvas();
    drag(svg, [20, 30], [21, 60], svg);
    drag(svg, [20, 30], [21, 31], svg);
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryAllByRole('button', { name: /^Box / })).toHaveLength(0);
  });

  it('senior: at zoom 2 a 40px screen drag produces a 20px image-space box', () => {
    const onChange = jest.fn();
    render(<Harness onChangeSpy={onChange} zoom={2} pan={{ x: 10, y: 10 }} />);
    const svg = canvas();
    drag(svg, [30, 30], [70, 70], svg);
    expect(onChange.mock.calls[0][0][0]).toMatchObject({ x: 10, y: 10, w: 20, h: 20 });
  });

  it('clamps a drawn box to the image bounds', () => {
    const onChange = jest.fn();
    render(<Harness onChangeSpy={onChange} />);
    const svg = canvas();
    drag(svg, [180, 80], [260, 160], svg);
    expect(onChange.mock.calls[0][0][0]).toMatchObject({ x: 180, y: 80, w: 20, h: 20 });
  });
});

describe('moving a box', () => {
  it('pointerdown on a box + move moves it by the image-space delta', () => {
    render(<Harness initial={[boxA]} />);
    const svg = canvas();
    const a = screen.getByRole('button', { name: 'Box a' });
    fireEvent.pointerDown(a, at(20, 20));
    expect(setCapture).toHaveBeenCalledWith(1);
    fireEvent.pointerMove(svg, at(50, 35));
    expect(box(a)).toEqual({ x: 40, y: 25, w: 40, h: 20 });
    fireEvent.pointerUp(svg, at(50, 35));
    expect(box(a)).toEqual({ x: 40, y: 25, w: 40, h: 20 });
    expect(screen.getAllByRole('button', { name: /^Box / })).toHaveLength(1);
  });

  it('clamps a move to the image bounds instead of letting the box leave the image', () => {
    render(<Harness initial={[boxA]} />);
    const svg = canvas();
    const a = screen.getByRole('button', { name: 'Box a' });
    drag(a, [20, 20], [-100, 500], svg);
    expect(box(a)).toEqual({ x: 0, y: 80, w: 40, h: 20 });
  });

  it('Escape during a drag cancels it and restores the pre-drag box; later moves are ignored', () => {
    const onChange = jest.fn();
    render(<Harness initial={[boxA]} onChangeSpy={onChange} />);
    const svg = canvas();
    const a = screen.getByRole('button', { name: 'Box a' });
    fireEvent.pointerDown(a, at(20, 20));
    fireEvent.pointerMove(svg, at(50, 35));
    expect(box(a)).toEqual({ x: 40, y: 25, w: 40, h: 20 });

    fireEvent.keyDown(svg, { key: 'Escape' });
    expect(box(a)).toEqual({ x: 10, y: 10, w: 40, h: 20 });
    expect(releaseCapture).toHaveBeenCalledWith(1);

    const calls = onChange.mock.calls.length;
    fireEvent.pointerMove(svg, at(90, 90));
    fireEvent.pointerUp(svg, at(90, 90));
    expect(box(a)).toEqual({ x: 10, y: 10, w: 40, h: 20 });
    expect(onChange).toHaveBeenCalledTimes(calls);
  });
});

describe('resizing with handles', () => {
  function select(svg: Element) {
    const a = screen.getByRole('button', { name: 'Box a' });
    fireEvent.pointerDown(a, at(20, 20));
    fireEvent.pointerUp(svg, at(20, 20));
    return a;
  }

  it('dragging the south-east handle grows the box', () => {
    render(<Harness initial={[boxA]} />);
    const svg = canvas();
    const a = select(svg);
    drag(screen.getByRole('button', { name: 'Resize Box a se' }), [50, 30], [70, 45], svg);
    expect(box(a)).toEqual({ x: 10, y: 10, w: 60, h: 35 });
  });

  it('dragging the north-west handle moves the origin and shrinks the box; the box stays clamped', () => {
    render(<Harness initial={[boxA]} />);
    const svg = canvas();
    const a = select(svg);
    drag(screen.getByRole('button', { name: 'Resize Box a nw' }), [10, 10], [20, 15], svg);
    expect(box(a)).toEqual({ x: 20, y: 15, w: 30, h: 15 });

    drag(screen.getByRole('button', { name: 'Resize Box a nw' }), [20, 15], [-50, -50], svg);
    expect(box(a)).toEqual({ x: 0, y: 0, w: 50, h: 30 });
  });

  it('senior: dragging a west handle past the east edge flips instead of producing a negative width', () => {
    render(<Harness initial={[boxA]} />);
    const svg = canvas();
    const a = select(svg);
    drag(screen.getByRole('button', { name: 'Resize Box a w' }), [10, 20], [70, 20], svg);
    expect(box(a)).toEqual({ x: 50, y: 10, w: 20, h: 20 });
  });
});

describe('keyboard', () => {
  function focusBox(name: string) {
    const el = screen.getByRole('button', { name });
    act(() => el.focus());
    return el;
  }

  it('arrow keys nudge the focused box by 1 image px, Shift+Arrow by 10', () => {
    render(<Harness initial={[boxA]} zoom={2} />);
    canvas();
    const a = focusBox('Box a');
    fireEvent.keyDown(a, { key: 'ArrowRight' });
    fireEvent.keyDown(a, { key: 'ArrowDown' });
    expect(box(a)).toEqual({ x: 11, y: 11, w: 40, h: 20 });
    fireEvent.keyDown(a, { key: 'ArrowLeft', shiftKey: true });
    fireEvent.keyDown(a, { key: 'ArrowUp', shiftKey: true });
    expect(box(a)).toEqual({ x: 1, y: 1, w: 40, h: 20 });
  });

  it('senior: a nudge that would exceed the image bounds clamps the box to the edge', () => {
    render(<Harness initial={[{ id: 'a', x: 155, y: 85, w: 40, h: 10 }]} />);
    canvas();
    const a = focusBox('Box a');
    fireEvent.keyDown(a, { key: 'ArrowRight', shiftKey: true });
    fireEvent.keyDown(a, { key: 'ArrowDown', shiftKey: true });
    expect(box(a)).toEqual({ x: 160, y: 90, w: 40, h: 10 });
    fireEvent.keyDown(a, { key: 'ArrowRight' });
    expect(box(a)).toEqual({ x: 160, y: 90, w: 40, h: 10 });
  });

  it('Delete removes the focused box and only that box', () => {
    const onChange = jest.fn();
    render(<Harness initial={[boxA, { id: 'b', x: 100, y: 50, w: 20, h: 20 }]} onChangeSpy={onChange} />);
    canvas();
    const a = focusBox('Box a');
    fireEvent.keyDown(a, { key: 'Delete' });
    expect(screen.queryByRole('button', { name: 'Box a' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Box b' })).toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith([{ id: 'b', x: 100, y: 50, w: 20, h: 20 }]);
  });

  it('arrow keys do nothing when no box is focused', () => {
    const onChange = jest.fn();
    render(<Harness initial={[boxA]} onChangeSpy={onChange} />);
    const svg = canvas();
    fireEvent.keyDown(svg, { key: 'ArrowRight' });
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('controlled component', () => {
  it('senior: renders only what the parent passes — if the parent ignores onChange the box does not move', () => {
    const onChange = jest.fn();
    render(<BBoxAnnotator {...IMAGE} viewport={VIEWPORT} value={[boxA]} onChange={onChange} />);
    const svg = canvas();
    const a = screen.getByRole('button', { name: 'Box a' });
    drag(a, [20, 20], [50, 35], svg);
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls[0][0][0]).toMatchObject({ id: 'a', x: 40, y: 25 });
    expect(box(a)).toEqual({ x: 10, y: 10, w: 40, h: 20 });
  });
});
