export type Validator = (
  value: string,
  allValues: Record<string, string>,
) => string | null;

export interface FormValidationOptions {
  form: HTMLFormElement;
  schema: Record<string, Validator[]>;
  onSubmit?: (values: Record<string, string>) => void;
}

export function createValidatedForm(options: FormValidationOptions): {
  validate: () => boolean;
  getValues: () => Record<string, string>;
  getErrors: () => Record<string, string | null>;
  destroy: () => void;
} {
  return {
    validate: () => false,
    getValues: () => ({}),
    getErrors: () => ({}),
    destroy() {},
  };
}
