export interface AutocompleteOptions {
  input: HTMLInputElement;
  data: string[];
  onSelect: (value: string) => void;
  debounceMs?: number;
}

export function createAutocomplete(options: AutocompleteOptions): {
  destroy: () => void;
} {
  return { destroy() {} };
}
