/**
 * @jest-environment jsdom
 */
import { createTooltip, TooltipOptions } from './tooltip';

function setup(overrides: Partial<TooltipOptions> = {}) {
  const target = document.createElement('button');
  target.textContent = 'Hover me';
  document.body.appendChild(target);
  const options: TooltipOptions = {
    target,
    content: 'Tooltip text',
    position: 'top',
    delay: 0,
    ...overrides,
  };
  const tooltip = createTooltip(options);
  return { target, tooltip };
}

function getTooltipEl() {
  return document.querySelector('[data-tooltip]');
}

function isVisible(el: Element | null): boolean {
  if (!el) return false;
  const htmlEl = el as HTMLElement;
  return (
    htmlEl.style.display !== 'none' &&
    !htmlEl.classList.contains('hidden') &&
    htmlEl.getAttribute('data-visible') !== 'false'
  );
}

afterEach(() => {
  document.body.innerHTML = '';
  jest.useRealTimers();
});

describe('createTooltip', () => {
  test('shows tooltip on mouseenter', () => {
    const { target } = setup();
    target.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    const el = getTooltipEl();
    expect(el).toBeTruthy();
    expect(isVisible(el)).toBe(true);
  });

  test('hides tooltip on mouseleave', () => {
    const { target } = setup();
    target.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    target.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    const el = getTooltipEl();
    expect(!el || !isVisible(el)).toBe(true);
  });

  test('respects delay before showing', () => {
    jest.useFakeTimers();
    const { target } = setup({ delay: 500 });
    target.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    const el1 = getTooltipEl();
    expect(!el1 || !isVisible(el1)).toBe(true);
    jest.advanceTimersByTime(500);
    const el2 = getTooltipEl();
    expect(el2).toBeTruthy();
    expect(isVisible(el2)).toBe(true);
  });

  test('show() method makes tooltip visible', () => {
    const { tooltip } = setup();
    tooltip.show();
    const el = getTooltipEl();
    expect(el).toBeTruthy();
    expect(isVisible(el)).toBe(true);
  });

  test('hide() method hides tooltip', () => {
    const { tooltip } = setup();
    tooltip.show();
    tooltip.hide();
    const el = getTooltipEl();
    expect(!el || !isVisible(el)).toBe(true);
  });

  test('position class is applied', () => {
    const { tooltip } = setup({ position: 'bottom' });
    tooltip.show();
    const el = getTooltipEl();
    expect(el).toBeTruthy();
    expect(el!.classList.contains('tooltip-bottom')).toBe(true);
  });

  test('different position classes', () => {
    const { tooltip } = setup({ position: 'left' });
    tooltip.show();
    const el = getTooltipEl();
    expect(el!.classList.contains('tooltip-left')).toBe(true);
  });

  test('content is rendered', () => {
    const { tooltip } = setup({ content: 'Hello World' });
    tooltip.show();
    const el = getTooltipEl();
    expect(el!.textContent).toBe('Hello World');
  });

  test('destroy removes tooltip and listeners', () => {
    const { target, tooltip } = setup();
    tooltip.show();
    tooltip.destroy();
    expect(getTooltipEl()).toBeNull();
    target.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    expect(getTooltipEl()).toBeNull();
  });
});
