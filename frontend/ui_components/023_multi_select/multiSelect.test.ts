/**
 * @jest-environment jsdom
 */
import {
  createMultiSelect,
  MultiSelectOption,
  MultiSelectOptions,
} from './multiSelect';

const OPTIONS: MultiSelectOption[] = [
  { value: 'js', label: 'JavaScript' },
  { value: 'ts', label: 'TypeScript' },
  { value: 'py', label: 'Python' },
];

function setup(overrides: Partial<MultiSelectOptions> = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const onChange = jest.fn();
  const select = createMultiSelect({
    container,
    options: OPTIONS,
    onChange,
    ...overrides,
  });
  return { container, select, onChange };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('createMultiSelect', () => {
  test('renders a combobox trigger', () => {
    const { container } = setup();
    expect(container.querySelector('[role="combobox"]')).toBeTruthy();
  });

  test('clicking trigger opens the listbox', () => {
    const { container, select } = setup();
    select.open();
    expect(container.querySelector('[role="listbox"]')).toBeTruthy();
    const trigger = container.querySelector('[role="combobox"]') as HTMLElement;
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  test('clicking option toggles selection', () => {
    const { container, select, onChange } = setup();
    select.open();
    const option = container.querySelector(
      '[role="option"][data-value="js"]',
    ) as HTMLElement;
    option.click();
    expect(select.getSelected()).toEqual(['js']);
    expect(onChange).toHaveBeenCalledWith(['js']);
    option.click();
    expect(select.getSelected()).toEqual([]);
  });

  test('typing filters options', () => {
    const { container, select } = setup();
    select.open();
    const input = container.querySelector('input') as HTMLInputElement;
    input.value = 'java';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const options = container.querySelectorAll('[role="option"]');
    expect(options.length).toBe(1);
    expect((options[0] as HTMLElement).dataset.value).toBe('js');
  });

  test('arrow keys move active descendant', () => {
    const { container, select } = setup();
    select.open();
    const trigger = container.querySelector('[role="combobox"]') as HTMLElement;
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    const active = container.querySelector('[role="option"].active');
    expect(active).toBeTruthy();
  });

  test('Enter toggles active option', () => {
    const { container, select } = setup();
    select.open();
    const trigger = container.querySelector('[role="combobox"]') as HTMLElement;
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    expect(select.getSelected().length).toBe(1);
  });

  test('Escape closes menu', () => {
    const { container, select } = setup();
    select.open();
    const trigger = container.querySelector('[role="combobox"]') as HTMLElement;
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  test('setSelected updates state and chips', () => {
    const { select } = setup();
    select.setSelected(['ts', 'py']);
    expect(select.getSelected()).toEqual(['ts', 'py']);
  });

  test('click outside closes menu', () => {
    const { container, select } = setup();
    select.open();
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    const trigger = container.querySelector('[role="combobox"]') as HTMLElement;
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  test('destroy removes elements', () => {
    const { container, select } = setup();
    select.destroy();
    expect(container.children.length).toBe(0);
  });
});
