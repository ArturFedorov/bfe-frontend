export interface AccordionItem {
  title: string;
  content: string;
}

export interface AccordionOptions {
  container: HTMLElement;
  items: AccordionItem[];
  allowMultiple?: boolean;
}

export function createAccordion(options: AccordionOptions): {
  toggle: (index: number) => void;
  destroy: () => void;
} {
  return { toggle() {}, destroy() {} };
}
