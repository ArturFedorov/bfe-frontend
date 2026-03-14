export interface SliderOptions {
  container: HTMLElement;
  min?: number;
  max?: number;
  step?: number;
  initialValue?: number;
  onChange?: (value: number) => void;
}

export function createSlider(options: SliderOptions): {
  getValue: () => number;
  setValue: (value: number) => void;
  destroy: () => void;
} {
  return { getValue: () => 0, setValue() {}, destroy() {} };
}
