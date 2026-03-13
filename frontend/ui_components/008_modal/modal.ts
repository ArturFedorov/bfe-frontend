export interface ModalOptions {
  content: HTMLElement | string;
  onClose?: () => void;
  closeOnOverlay?: boolean;
  closeOnEsc?: boolean;
}

export function createModal(options: ModalOptions): {
  open: () => void;
  close: () => void;
  destroy: () => void;
} {
  return { open() {}, close() {}, destroy() {} };
}
