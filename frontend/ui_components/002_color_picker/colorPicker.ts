export interface ColorPickerOptions {
  container: HTMLElement;
  initialColor?: string;
  onChange?: (color: string) => void;
}

export function createColorPicker(options: ColorPickerOptions): {
  getColor: () => string;
  setColor: (color: string) => void;
  destroy: () => void;
} {
  return { getColor: () => '', setColor() {}, destroy() {} };
}
