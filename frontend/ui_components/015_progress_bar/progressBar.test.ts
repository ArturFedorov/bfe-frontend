import { createProgressBar, ProgressBarOptions } from './progressBar';

function setupDOM() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  return container;
}

function teardownDOM(container: HTMLElement) {
  container.remove();
}

function getFill(container: HTMLElement) {
  return container.querySelector('[data-progress-fill]') as HTMLElement | null;
}

describe('createProgressBar', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = setupDOM();
  });

  afterEach(() => {
    teardownDOM(container);
  });

  it('should render a progress bar with track and fill', () => {
    createProgressBar({ container });

    expect(container.querySelector('[data-progress-track]')).not.toBeNull();
    expect(getFill(container)).not.toBeNull();
  });

  it('should use initialValue for width', () => {
    createProgressBar({ container, initialValue: 40 });

    const fill = getFill(container)!;
    expect(fill.style.width).toBe('40%');
  });

  it('should default to 0 when no initialValue', () => {
    const bar = createProgressBar({ container });

    expect(bar.getValue()).toBe(0);
    const fill = getFill(container)!;
    expect(fill.style.width).toBe('0%');
  });

  it('should update width via setValue()', () => {
    const bar = createProgressBar({ container });

    bar.setValue(65);

    const fill = getFill(container)!;
    expect(fill.style.width).toBe('65%');
    expect(bar.getValue()).toBe(65);
  });

  it('should return current value via getValue()', () => {
    const bar = createProgressBar({ container, initialValue: 25 });

    expect(bar.getValue()).toBe(25);

    bar.setValue(90);
    expect(bar.getValue()).toBe(90);
  });

  it('should clamp value to 0 (not go below)', () => {
    const bar = createProgressBar({ container });

    bar.setValue(-10);

    expect(bar.getValue()).toBe(0);
    const fill = getFill(container)!;
    expect(fill.style.width).toBe('0%');
  });

  it('should clamp value to 100 (not go above)', () => {
    const bar = createProgressBar({ container });

    bar.setValue(150);

    expect(bar.getValue()).toBe(100);
    const fill = getFill(container)!;
    expect(fill.style.width).toBe('100%');
  });

  it("should add 'animated' class when animated option is true", () => {
    createProgressBar({ container, animated: true });

    const fill = getFill(container)!;
    expect(fill.classList.contains('animated')).toBe(true);
  });

  it("should not add 'animated' class when animated option is false", () => {
    createProgressBar({ container, animated: false });

    const fill = getFill(container)!;
    expect(fill.classList.contains('animated')).toBe(false);
  });

  it('should clean up DOM on destroy()', () => {
    const bar = createProgressBar({ container });

    bar.destroy();

    expect(container.innerHTML).toBe('');
  });
});
