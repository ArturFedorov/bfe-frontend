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

  it('clamps negative current to 0', () => {
    expect(renderBar(-5, 10, 10)).toBe('[----------] 0%');
  });

  it('renders a one-third fraction with exact width divisibility', () => {
    expect(renderBar(1, 3, 3)).toBe('[#--] 33%');
  });

  it('renders a two-thirds fraction with exact width divisibility', () => {
    expect(renderBar(2, 3, 3)).toBe('[##-] 67%');
  });

  it('renders with a width larger than 10', () => {
    expect(renderBar(5, 10, 20)).toBe('[##########----------] 50%');
  });

  it('renders an empty bar with width 1', () => {
    expect(renderBar(0, 2, 1)).toBe('[-] 0%');
  });

  it('renders a full bar with width 1', () => {
    expect(renderBar(2, 2, 1)).toBe('[#] 100%');
  });

  it('rounds the percentage using standard half-up rounding', () => {
    expect(renderBar(1, 8, 8)).toBe('[#-------] 13%');
  });

  it('rounds fill and percentage for a non-divisible ratio', () => {
    expect(renderBar(333, 1000, 10)).toBe('[###-------] 33%');
  });
});
