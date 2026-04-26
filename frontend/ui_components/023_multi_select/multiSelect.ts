export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectOptions {
  container: HTMLElement;
  options: MultiSelectOption[];
  initialSelected?: string[];
  placeholder?: string;
  onChange?: (values: string[]) => void;
}

export function createMultiSelect(options: MultiSelectOptions): {
  getSelected: () => string[];
  setSelected: (values: string[]) => void;
  open: () => void;
  close: () => void;
  destroy: () => void;
} {
  return {
    getSelected: () => [],
    setSelected() {},
    open() {},
    close() {},
    destroy() {},
  };
}
