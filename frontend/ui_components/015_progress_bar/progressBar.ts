export interface ProgressBarOptions {
  container: HTMLElement;
  initialValue?: number;
  animated?: boolean;
}

export function createProgressBar(options: ProgressBarOptions): { setValue: (value: number) => void; getValue: () => number; destroy: () => void } {
  return { setValue() {}, getValue: () => 0, destroy() {} };
}
