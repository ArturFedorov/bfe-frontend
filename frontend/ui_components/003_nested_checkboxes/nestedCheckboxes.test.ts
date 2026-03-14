/**
 * @jest-environment jsdom
 */
import { createNestedCheckboxes, CheckboxNode } from './nestedCheckboxes';

function setup(data?: CheckboxNode[]) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const defaultData: CheckboxNode[] = [
    {
      label: 'Fruits',
      children: [{ label: 'Apple' }, { label: 'Banana' }, { label: 'Cherry' }],
    },
  ];
  const tree = createNestedCheckboxes(container, data ?? defaultData);
  return { container, tree };
}

function getCheckboxByLabel(
  container: HTMLElement,
  label: string,
): HTMLInputElement | null {
  const labels = container.querySelectorAll('label');
  for (const lbl of labels) {
    if (lbl.textContent?.includes(label)) {
      const checkbox =
        lbl.querySelector('input[type="checkbox"]') ||
        lbl.previousElementSibling;
      if (checkbox && checkbox instanceof HTMLInputElement) return checkbox;
    }
  }
  const checkboxes = container.querySelectorAll('input[type="checkbox"]');
  for (const cb of checkboxes) {
    const el = cb as HTMLInputElement;
    const parent = el.parentElement;
    if (parent && parent.textContent?.includes(label)) return el;
  }
  return null;
}

function clickCheckbox(checkbox: HTMLInputElement) {
  checkbox.checked = !checkbox.checked;
  checkbox.dispatchEvent(new Event('change', { bubbles: true }));
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('createNestedCheckboxes', () => {
  test('renders tree with checkboxes and labels', () => {
    const { container } = setup();
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes.length).toBe(4);
    expect(container.textContent).toContain('Fruits');
    expect(container.textContent).toContain('Apple');
    expect(container.textContent).toContain('Banana');
    expect(container.textContent).toContain('Cherry');
  });

  test('checking parent checks all children', () => {
    const { container } = setup();
    const parent = getCheckboxByLabel(container, 'Fruits')!;
    clickCheckbox(parent);
    expect(parent.checked).toBe(true);
    const apple = getCheckboxByLabel(container, 'Apple')!;
    const banana = getCheckboxByLabel(container, 'Banana')!;
    const cherry = getCheckboxByLabel(container, 'Cherry')!;
    expect(apple.checked).toBe(true);
    expect(banana.checked).toBe(true);
    expect(cherry.checked).toBe(true);
  });

  test('unchecking one child makes parent indeterminate', () => {
    const { container } = setup();
    const parent = getCheckboxByLabel(container, 'Fruits')!;
    clickCheckbox(parent);
    const apple = getCheckboxByLabel(container, 'Apple')!;
    clickCheckbox(apple);
    expect(parent.indeterminate).toBe(true);
  });

  test('checking all children checks parent automatically', () => {
    const { container } = setup();
    const apple = getCheckboxByLabel(container, 'Apple')!;
    const banana = getCheckboxByLabel(container, 'Banana')!;
    const cherry = getCheckboxByLabel(container, 'Cherry')!;
    clickCheckbox(apple);
    clickCheckbox(banana);
    clickCheckbox(cherry);
    const parent = getCheckboxByLabel(container, 'Fruits')!;
    expect(parent.checked).toBe(true);
    expect(parent.indeterminate).toBe(false);
  });

  test('getState returns current state', () => {
    const { container, tree } = setup();
    const apple = getCheckboxByLabel(container, 'Apple')!;
    clickCheckbox(apple);
    const state = tree.getState();
    expect(state).toEqual([
      {
        label: 'Fruits',
        checked: false,
        children: [
          { label: 'Apple', checked: true },
          { label: 'Banana', checked: false },
          { label: 'Cherry', checked: false },
        ],
      },
    ]);
  });

  test('deeply nested checkboxes propagate correctly', () => {
    const data: CheckboxNode[] = [
      {
        label: 'Root',
        children: [
          {
            label: 'Level1',
            children: [{ label: 'Level2A' }, { label: 'Level2B' }],
          },
        ],
      },
    ];
    const { container } = setup(data);
    const root = getCheckboxByLabel(container, 'Root')!;
    clickCheckbox(root);
    const l2a = getCheckboxByLabel(container, 'Level2A')!;
    const l2b = getCheckboxByLabel(container, 'Level2B')!;
    expect(l2a.checked).toBe(true);
    expect(l2b.checked).toBe(true);
  });

  test('unchecking parent unchecks all descendants', () => {
    const { container } = setup();
    const parent = getCheckboxByLabel(container, 'Fruits')!;
    clickCheckbox(parent);
    expect(parent.checked).toBe(true);
    clickCheckbox(parent);
    const apple = getCheckboxByLabel(container, 'Apple')!;
    const banana = getCheckboxByLabel(container, 'Banana')!;
    expect(apple.checked).toBe(false);
    expect(banana.checked).toBe(false);
  });
});
