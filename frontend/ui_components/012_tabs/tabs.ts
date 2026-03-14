export interface TabItem {
  label: string;
  content: string;
}

export interface TabOptions {
  container: HTMLElement;
  tabs: TabItem[];
  defaultIndex?: number;
}

export function createTabs(options: TabOptions): {
  setActive: (index: number) => void;
  getActive: () => number;
  destroy: () => void;
} {
  return { setActive() {}, getActive: () => 0, destroy() {} };
}
