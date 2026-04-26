/**
 * @jest-environment jsdom
 */
import { createToggleSwitch, ToggleSwitchOptions } from './toggleSwitch';

function setup(overrides: Partial<ToggleSwitchOptions> = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const onChange = jest.fn();
  const toggle = createToggleSwitch({ container, onChange, ...overrides });
  const button = container.querySelector('[role="switch"]') as HTMLElement;
  return { container, button, toggle, onChange };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('createToggleSwitch', () => {
  test('renders a button with role=switch', () => {
    const { button } = setup();
    expect(button).toBeTruthy();
  });

  test('aria-checked reflects state', () => {
    const { button } = setup({ initialChecked: true });
    expect(button.getAttribute('aria-checked')).toBe('true');
  });

  test('click toggles state in uncontrolled mode', () => {
    const { button, toggle, onChange } = setup();
    button.click();
    expect(toggle.getChecked()).toBe(true);
    expect(onChange).toHaveBeenCalledWith(true);
    expect(button.getAttribute('aria-checked')).toBe('true');
  });

  test('Space key toggles state', () => {
    const { button, toggle } = setup();
    button.focus();
    button.dispatchEvent(
      new KeyboardEvent('keydown', { key: ' ', bubbles: true }),
    );
    expect(toggle.getChecked()).toBe(true);
  });

  test('Enter key toggles state', () => {
    const { button, toggle } = setup();
    button.focus();
    button.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    expect(toggle.getChecked()).toBe(true);
  });

  test('setChecked updates DOM', () => {
    const { button, toggle } = setup();
    toggle.setChecked(true);
    expect(toggle.getChecked()).toBe(true);
    expect(button.getAttribute('aria-checked')).toBe('true');
  });

  test('disabled prevents toggling', () => {
    const { button, toggle, onChange } = setup({ disabled: true });
    button.click();
    expect(toggle.getChecked()).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
    expect(button.getAttribute('aria-disabled')).toBe('true');
  });

  test('controlled mode does not mutate internal state on click', () => {
    const { button, toggle, onChange } = setup({ controlled: true });
    button.click();
    expect(toggle.getChecked()).toBe(false);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  test('onChange does not fire when state does not change', () => {
    const { toggle, onChange } = setup();
    toggle.setChecked(false);
    expect(onChange).not.toHaveBeenCalled();
  });

  test('destroy removes element', () => {
    const { container, toggle } = setup();
    toggle.destroy();
    expect(container.querySelector('[role="switch"]')).toBeNull();
  });
});
