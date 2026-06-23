import { TypedEmitter } from './type_safe_event_emitter';

type Events = { click: { x: number; y: number } };

describe('TypedEmitter', () => {
  it('delivers typed payloads to listeners', () => {
    const ee = new TypedEmitter<Events>();
    const seen: number[] = [];
    ee.on('click', (p) => seen.push(p.x));
    const fired = ee.emit('click', { x: 1, y: 2 });
    expect(fired).toBe(true);
    expect(seen).toEqual([1]);
  });

  it('returns false when there are no listeners', () => {
    const ee = new TypedEmitter<Events>();
    expect(ee.emit('click', { x: 0, y: 0 })).toBe(false);
  });
});
