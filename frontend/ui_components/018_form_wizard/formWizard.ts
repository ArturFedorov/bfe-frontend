export interface WizardStep {
  title: string;
  fields: { name: string; type: string; required?: boolean }[];
}

export interface FormWizardOptions {
  container: HTMLElement;
  steps: WizardStep[];
  onSubmit: (data: Record<string, any>) => void;
}

export function createFormWizard(options: FormWizardOptions): {
  next: () => boolean;
  prev: () => void;
  getCurrentStep: () => number;
  getData: () => Record<string, any>;
  destroy: () => void;
} {
  return {
    next: () => false,
    prev() {},
    getCurrentStep: () => 0,
    getData: () => ({}),
    destroy() {},
  };
}
