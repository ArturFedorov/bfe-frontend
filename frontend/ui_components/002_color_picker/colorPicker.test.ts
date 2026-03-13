/**
 * @jest-environment jsdom
 */
import { createColorPicker, ColorPickerOptions } from './colorPicker';

function setup(overrides: Partial<ColorPickerOptions> = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const onChange = jest.fn();
  const options: ColorPickerOptions = {
    container,
    onChange,
    ...overrides,
  };
  const picker = createColorPicker(options);
  return { container, onChange, picker };
}

function getSwatches(container: HTMLElement) {
  return container.querySelectorAll('[data-color]');
}

function getActiveSwatch(container: HTMLElement) {
  return container.querySelector('[data-color].active, [data-color][data-selected="true"]');
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('createColorPicker', () => {
  test('renders color swatches', () => {
    const { container } = setup();
    const swatches = getSwatches(container);
    expect(swatches.length).toBeGreaterThan(0);
  });

  test('click swatch changes selected color', () => {
    const { container, picker } = setup();
    const swatches = getSwatches(container);
    const target = swatches[2] as HTMLElement;
    const expectedColor = target.getAttribute('data-color');
    target.click();
    expect(picker.getColor()).toBe(expectedColor);
  });

  test('getColor returns current selected color', () => {
    const { picker } = setup({ initialColor: '#ff0000' });
    expect(picker.getColor()).toBe('#ff0000');
  });

  test('setColor updates the selection', () => {
    const { container, picker } = setup();
    const swatches = getSwatches(container);
    const color = swatches[1].getAttribute('data-color')!;
    picker.setColor(color);
    expect(picker.getColor()).toBe(color);
    const active = getActiveSwatch(container);
    expect(active).toBeTruthy();
    expect(active!.getAttribute('data-color')).toBe(color);
  });

  test('onChange callback fires on swatch click', () => {
    const { container, onChange } = setup();
    const swatches = getSwatches(container);
    const target = swatches[0] as HTMLElement;
    const expectedColor = target.getAttribute('data-color');
    target.click();
    expect(onChange).toHaveBeenCalledWith(expectedColor);
  });

  test('onChange callback fires on setColor', () => {
    const { container, onChange, picker } = setup();
    const swatches = getSwatches(container);
    const color = swatches[3].getAttribute('data-color')!;
    picker.setColor(color);
    expect(onChange).toHaveBeenCalledWith(color);
  });

  test('initialColor pre-selects a swatch', () => {
    const { container, picker } = setup({ initialColor: '#ff0000' });
    expect(picker.getColor()).toBe('#ff0000');
    const active = getActiveSwatch(container);
    expect(active).toBeTruthy();
  });

  test('destroy cleans up DOM', () => {
    const { container, picker } = setup();
    expect(getSwatches(container).length).toBeGreaterThan(0);
    picker.destroy();
    expect(getSwatches(container).length).toBe(0);
  });
});
