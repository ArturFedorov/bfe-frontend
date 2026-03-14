import { createAccordion, AccordionOptions } from './accordion';

function setupDOM() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  return container;
}

function teardownDOM(container: HTMLElement) {
  container.remove();
}

function getHeaders(container: HTMLElement) {
  return Array.from(container.querySelectorAll('[data-accordion-header]'));
}

function getPanels(container: HTMLElement) {
  return Array.from(container.querySelectorAll('[data-accordion-panel]'));
}

function isPanelVisible(panel: Element): boolean {
  return (
    (panel as HTMLElement).style.display !== 'none' &&
    !panel.classList.contains('hidden')
  );
}

const items = [
  { title: 'Section 1', content: 'Content 1' },
  { title: 'Section 2', content: 'Content 2' },
  { title: 'Section 3', content: 'Content 3' },
];

describe('createAccordion', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = setupDOM();
  });

  afterEach(() => {
    teardownDOM(container);
  });

  it('should render all accordion sections with headers and panels', () => {
    createAccordion({ container, items });

    const headers = getHeaders(container);
    const panels = getPanels(container);

    expect(headers.length).toBe(3);
    expect(panels.length).toBe(3);
    expect(headers[0].textContent).toContain('Section 1');
    expect(panels[0].textContent).toContain('Content 1');
  });

  it('should toggle a section open on header click', () => {
    createAccordion({ container, items });

    const headers = getHeaders(container);
    const panels = getPanels(container);

    (headers[0] as HTMLElement).click();
    expect(isPanelVisible(panels[0])).toBe(true);
  });

  it('should close a section when clicking its header again', () => {
    createAccordion({ container, items });

    const headers = getHeaders(container);
    const panels = getPanels(container);

    (headers[0] as HTMLElement).click();
    expect(isPanelVisible(panels[0])).toBe(true);

    (headers[0] as HTMLElement).click();
    expect(isPanelVisible(panels[0])).toBe(false);
  });

  it('should close other sections in single mode (default)', () => {
    createAccordion({ container, items });

    const headers = getHeaders(container);
    const panels = getPanels(container);

    (headers[0] as HTMLElement).click();
    expect(isPanelVisible(panels[0])).toBe(true);

    (headers[1] as HTMLElement).click();
    expect(isPanelVisible(panels[0])).toBe(false);
    expect(isPanelVisible(panels[1])).toBe(true);
  });

  it('should keep other sections open when allowMultiple is true', () => {
    createAccordion({ container, items, allowMultiple: true });

    const headers = getHeaders(container);
    const panels = getPanels(container);

    (headers[0] as HTMLElement).click();
    (headers[1] as HTMLElement).click();

    expect(isPanelVisible(panels[0])).toBe(true);
    expect(isPanelVisible(panels[1])).toBe(true);
  });

  it('should toggle a section programmatically via toggle()', () => {
    const accordion = createAccordion({ container, items });
    const panels = getPanels(container);

    accordion.toggle(1);
    expect(isPanelVisible(panels[1])).toBe(true);

    accordion.toggle(1);
    expect(isPanelVisible(panels[1])).toBe(false);
  });

  it('should clean up DOM and event listeners on destroy()', () => {
    const accordion = createAccordion({ container, items });

    expect(container.children.length).toBeGreaterThan(0);

    accordion.destroy();

    expect(container.innerHTML).toBe('');
  });
});
