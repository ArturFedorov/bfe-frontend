export interface ToggleSwitchOptions {
  container: HTMLElement;
  initialChecked?: boolean;
  controlled?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
}

export function createToggleSwitch(options: ToggleSwitchOptions): {
  getChecked: () => boolean;
  setChecked: (checked: boolean) => void;
  destroy: () => void;
} {
  return { getChecked: () => false, setChecked() {}, destroy() {} };
}
