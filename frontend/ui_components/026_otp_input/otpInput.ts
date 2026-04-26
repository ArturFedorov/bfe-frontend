export interface OtpInputOptions {
  container: HTMLElement;
  length?: number;
  allowedPattern?: RegExp;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
}

export function createOtpInput(options: OtpInputOptions): {
  getValue: () => string;
  setValue: (value: string) => void;
  clear: () => void;
  destroy: () => void;
} {
  return {
    getValue: () => '',
    setValue() {},
    clear() {},
    destroy() {},
  };
}
