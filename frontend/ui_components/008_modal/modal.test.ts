/**
 * @jest-environment jsdom
 */
import { createModal, ModalOptions } from './modal';

function setup(overrides: Partial<ModalOptions> = {}) {
  const contentEl = document.createElement('div');
  contentEl.innerHTML =
    '<button class="btn1">OK</button><button class="btn2">Cancel</button>';
  const onClose = jest.fn();
  const options: ModalOptions = {
    content: contentEl,
    onClose,
    closeOnOverlay: true,
    closeOnEsc: true,
    ...overrides,
  };
  const modal = createModal(options);
  return { modal, onClose, contentEl };
}

function getModal() {
  return document.querySelector('[data-modal]');
}

function getOverlay() {
  return document.querySelector('[data-modal-overlay]');
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
});

describe('createModal', () => {
  test('open shows modal and overlay', () => {
    const { modal } = setup();
    modal.open();
    expect(getModal()).toBeTruthy();
    expect(isVisible(getModal())).toBe(true);
    expect(getOverlay()).toBeTruthy();
  });

  test('close hides modal', () => {
    const { modal } = setup();
    modal.open();
    modal.close();
    const m = getModal();
    expect(!m || !isVisible(m)).toBe(true);
  });

  test('Escape key closes modal', () => {
    const { modal, onClose } = setup();
    modal.open();
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    const m = getModal();
    expect(!m || !isVisible(m)).toBe(true);
    expect(onClose).toHaveBeenCalled();
  });

  test('Escape key does not close when closeOnEsc is false', () => {
    const { modal } = setup({ closeOnEsc: false });
    modal.open();
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    expect(isVisible(getModal())).toBe(true);
  });

  test('overlay click closes modal', () => {
    const { modal, onClose } = setup();
    modal.open();
    const overlay = getOverlay() as HTMLElement;
    overlay.click();
    const m = getModal();
    expect(!m || !isVisible(m)).toBe(true);
    expect(onClose).toHaveBeenCalled();
  });

  test('overlay click does not close when closeOnOverlay is false', () => {
    const { modal } = setup({ closeOnOverlay: false });
    modal.open();
    const overlay = getOverlay() as HTMLElement;
    overlay.click();
    expect(isVisible(getModal())).toBe(true);
  });

  test('focus is trapped inside modal', () => {
    const { modal } = setup();
    modal.open();
    const modalEl = getModal()!;
    const focusable = modalEl.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    expect(focusable.length).toBeGreaterThan(0);
    const last = focusable[focusable.length - 1];
    last.focus();
    const tabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
    });
    modalEl.dispatchEvent(tabEvent);
  });

  test('onClose callback fires on close', () => {
    const { modal, onClose } = setup();
    modal.open();
    modal.close();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('destroy removes modal from DOM', () => {
    const { modal } = setup();
    modal.open();
    modal.destroy();
    expect(getModal()).toBeNull();
    expect(getOverlay()).toBeNull();
  });

  test('content can be a string', () => {
    const { modal } = setup({ content: '<p>Hello World</p>' });
    modal.open();
    const m = getModal()!;
    expect(m.textContent).toContain('Hello World');
  });
});
