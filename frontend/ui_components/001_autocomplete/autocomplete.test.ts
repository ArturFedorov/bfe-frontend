/**
 * @jest-environment jsdom
 */
import { createAutocomplete } from './autocomplete';

const DATA = ['Apple', 'Banana', 'Avocado', 'Blueberry', 'Cherry'];

function setup(
  fetchSuggestions: (query: string) => Promise<string[]> = async (q) =>
    DATA.filter((d) => d.toLowerCase().includes(q.toLowerCase())),
) {
  const input = document.createElement('input');
  const container = document.createElement('div');
  document.body.appendChild(input);
  document.body.appendChild(container);
  const ac = createAutocomplete(input, container, fetchSuggestions);
  return { input, container, ac };
}

async function typeInto(input: HTMLInputElement, value: string) {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  jest.advanceTimersByTime(300);
  await flushPromises();
}

function flushPromises() {
  return new Promise((resolve) =>
    jest.requireActual('timers').setTimeout(resolve, 0),
  );
}

function getItems() {
  return document.querySelectorAll('#autocomplete-list li');
}

function getList() {
  return document.querySelector('#autocomplete-list') as HTMLElement | null;
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  document.body.innerHTML = '';
  jest.useRealTimers();
});

describe('createAutocomplete', () => {
  test('renders suggestions on input', async () => {
    const { input } = setup();
    await typeInto(input, 'a');
    const items = getItems();
    expect(items.length).toBeGreaterThan(0);
  });

  test('filters suggestions by query (case-insensitive)', async () => {
    const { input } = setup();
    await typeInto(input, 'bl');
    const items = getItems();
    expect(items.length).toBe(1);
    expect(items[0].textContent).toBe('Blueberry');
  });

  test('selects item on click', async () => {
    const { input } = setup();
    await typeInto(input, 'a');
    const items = getItems();
    (items[0] as HTMLElement).click();
    expect(input.value).toBe(items[0].textContent);
  });

  test('hides dropdown after selection', async () => {
    const { input } = setup();
    await typeInto(input, 'a');
    const items = getItems();
    (items[0] as HTMLElement).click();
    const list = getList();
    expect(list?.style.display).toBe('none');
  });

  test('keyboard navigation: ArrowDown highlights next item', async () => {
    const { input } = setup();
    await typeInto(input, 'a');
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    const highlighted = document.querySelector('#autocomplete-list li.active');
    expect(highlighted).toBeTruthy();
  });

  test('keyboard navigation: ArrowUp highlights previous item', async () => {
    const { input } = setup();
    await typeInto(input, 'a');
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
    expect(items[0].classList.contains('active')).toBe(true);
  });

  test('keyboard navigation: Enter selects highlighted item', async () => {
    const { input } = setup();
    await typeInto(input, 'a');
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    expect(input.value).not.toBe('a');
  });

  test('destroy cleans up DOM and listeners', async () => {
    const { input, ac } = setup();
    await typeInto(input, 'a');
    expect(getItems().length).toBeGreaterThan(0);
    ac.destroy();
    await typeInto(input, 'b');
    expect(getList()).toBeNull();
  });

  test('shows nothing for empty query', async () => {
    const { input } = setup();
    await typeInto(input, '');
    expect(getItems().length).toBe(0);
  });

  test('shows nothing when no results match', async () => {
    const { input } = setup();
    await typeInto(input, 'zzz');
    expect(getItems().length).toBe(0);
  });
});
