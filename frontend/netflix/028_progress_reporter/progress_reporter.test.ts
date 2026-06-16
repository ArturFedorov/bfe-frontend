import { renderBar } from './progress_reporter';

describe('renderBar', () => {
  it('renders an empty bar at 0%', () => {
    expect(renderBar(0, 10, 10)).toBe('[----------] 0%');
  });

  it('renders a partial bar', () => {
    expect(renderBar(3, 10, 10)).toBe('[###-------] 30%');
  });

  it('renders a full bar at 100%', () => {
    expect(renderBar(10, 10, 10)).toBe('[##########] 100%');
  });

  it('clamps overflow', () => {
    expect(renderBar(15, 10, 10)).toBe('[##########] 100%');
  });
});
