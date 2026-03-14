export interface CheckboxNode {
  label: string;
  checked?: boolean;
  children?: CheckboxNode[];
}

export function createNestedCheckboxes(
  container: HTMLElement,
  data: CheckboxNode[],
): { getState: () => CheckboxNode[] } {
  return { getState: () => [] };
}
