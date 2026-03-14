/**
 * @jest-environment jsdom
 */
import { createAutocomplete, AutocompleteOptions } from './autocomplete';

function setup(overrides: Partial<AutocompleteOptions> = {}) {
  const input = document.createElement('input');
  document.body.appendChild(input);
  const onSelect = jest.fn();
  const options: AutocompleteOptions = {
    input,
    data: ['Apple', 'Banana', 'Avocado', 'Blueberry', 'Cherry'],
    onSelect,
    debounceMs: 0,
    ...overrides,
  };
  const ac = createAutocomplete(options);
  return { input, onSelect, ac, options };
}

function typeInto(input: HTMLInputElement, value: string) {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function getItems() {
  return document.querySelectorAll('[data-autocomplete-item]');
}

function getDropdown() {
  return document.querySelector('[data-autocomplete-list]');
}

afterEach(() => {
  document.body.innerHTML = '';
  jest.useRealTimers();
});

describe('createAutocomplete', () => {
  test('renders suggestions on input', () => {
    const { input } = setup();
    typeInto(input, 'a');
    const items = getItems();
    expect(items.length).toBeGreaterThan(0);
  });

  test('filters suggestions by query (case-insensitive)', () => {
    const { input } = setup();
    typeInto(input, 'bl');
    const items = getItems();
    expect(items.length).toBe(1);
    expect(items[0].textContent).toBe('Blueberry');
  });

  test('selects item on click', () => {
    const { input, onSelect } = setup();
    typeInto(input, 'a');
    const items = getItems();
    (items[0] as HTMLElement).click();
    expect(onSelect).toHaveBeenCalledWith(items[0].textContent);
    expect(input.value).toBe(items[0].textContent);
  });

  test('hides dropdown after selection', () => {
    const { input } = setup();
    typeInto(input, 'a');
    const items = getItems();
    (items[0] as HTMLElement).click();
    const dropdown = getDropdown();
    const isHidden =
      !dropdown ||
      dropdown.children.length === 0 ||
      (dropdown as HTMLElement).style.display === 'none';
    expect(isHidden).toBe(true);
  });

  test('keyboard navigation: ArrowDown highlights next item', () => {
    const { input } = setup();
    typeInto(input, 'a');
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    const items = getItems();
    const highlighted = document.querySelector(
      '[data-autocomplete-item][data-active="true"], [data-autocomplete-item].active',
    );
    expect(highlighted).toBeTruthy();
  });

  test('keyboard navigation: ArrowUp highlights previous item', () => {
    const { input } = setup();
    typeInto(input, 'a');
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }),
    );
    const items = getItems();
    const activeItem = items[0];
    const isActive =
      activeItem.getAttribute('data-active') === 'true' ||
      activeItem.classList.contains('active');
    expect(isActive).toBe(true);
  });

  test('keyboard navigation: Enter selects highlighted item', () => {
    const { input, onSelect } = setup();
    typeInto(input, 'a');
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    expect(onSelect).toHaveBeenCalled();
  });

  test('debounces input events', () => {
    jest.useFakeTimers();
    const { input } = setup({ debounceMs: 300 });
    typeInto(input, 'a');
    expect(getItems().length).toBe(0);
    jest.advanceTimersByTime(300);
    expect(getItems().length).toBeGreaterThan(0);
  });

  test('destroy cleans up DOM and listeners', () => {
    const { input, ac } = setup();
    typeInto(input, 'a');
    expect(getItems().length).toBeGreaterThan(0);
    ac.destroy();
    typeInto(input, 'b');
    const dropdown = getDropdown();
    const noItems = !dropdown || dropdown.children.length === 0;
    expect(noItems).toBe(true);
  });

  test('shows nothing for empty query', () => {
    const { input } = setup();
    typeInto(input, '');
    expect(getItems().length).toBe(0);
  });

  test('shows nothing when no results match', () => {
    const { input } = setup();
    typeInto(input, 'zzz');
    expect(getItems().length).toBe(0);
  });
});
