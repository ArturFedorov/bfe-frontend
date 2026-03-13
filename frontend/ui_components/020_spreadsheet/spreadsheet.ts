export interface SpreadsheetOptions {
  container: HTMLElement;
  rows: number;
  cols: number;
}

export function createSpreadsheet(options: SpreadsheetOptions): {
  setCell: (row: number, col: number, value: string) => void;
  getCell: (row: number, col: number) => string;
  getCellDisplay: (row: number, col: number) => string;
  destroy: () => void;
} {
  return { setCell() {}, getCell: () => "", getCellDisplay: () => "", destroy() {} };
}
