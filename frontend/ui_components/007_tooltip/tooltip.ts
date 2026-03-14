export interface TooltipOptions {
  target: HTMLElement;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export function createTooltip(options: TooltipOptions): {
  show: () => void;
  hide: () => void;
  destroy: () => void;
} {
  return { show() {}, hide() {}, destroy() {} };
}
