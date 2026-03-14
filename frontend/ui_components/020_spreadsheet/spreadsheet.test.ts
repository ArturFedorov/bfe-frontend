import { createSpreadsheet, SpreadsheetOptions } from './spreadsheet';

function setupDOM() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  return container;
}

function teardownDOM(container: HTMLElement) {
  container.remove();
}

function getCellElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll('[data-cell]'));
}

describe('createSpreadsheet', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = setupDOM();
  });

  afterEach(() => {
    teardownDOM(container);
  });

  it('should render a grid with the correct number of cells', () => {
    createSpreadsheet({ container, rows: 3, cols: 3 });

    const cells = getCellElements(container);
    expect(cells.length).toBe(9);
  });

  it('should store and retrieve raw cell values', () => {
    const sheet = createSpreadsheet({ container, rows: 3, cols: 3 });

    sheet.setCell(0, 0, 'Hello');
    expect(sheet.getCell(0, 0)).toBe('Hello');
  });

  it('should return empty string for unset cells', () => {
    const sheet = createSpreadsheet({ container, rows: 3, cols: 3 });

    expect(sheet.getCell(0, 0)).toBe('');
  });

  it('should display raw value for non-formula cells', () => {
    const sheet = createSpreadsheet({ container, rows: 3, cols: 3 });

    sheet.setCell(0, 0, '42');
    expect(sheet.getCellDisplay(0, 0)).toBe('42');
  });

  it('should evaluate =SUM(A1:A3) formula', () => {
    const sheet = createSpreadsheet({ container, rows: 5, cols: 3 });

    sheet.setCell(0, 0, '10');
    sheet.setCell(1, 0, '20');
    sheet.setCell(2, 0, '30');
    sheet.setCell(3, 0, '=SUM(A1:A3)');

    expect(sheet.getCellDisplay(3, 0)).toBe('60');
  });

  it('should evaluate cell reference formula =A1+B1', () => {
    const sheet = createSpreadsheet({ container, rows: 3, cols: 3 });

    sheet.setCell(0, 0, '10');
    sheet.setCell(0, 1, '25');
    sheet.setCell(0, 2, '=A1+B1');

    expect(sheet.getCellDisplay(0, 2)).toBe('35');
  });

  it('should handle chained references', () => {
    const sheet = createSpreadsheet({ container, rows: 4, cols: 2 });

    sheet.setCell(0, 0, '5');
    sheet.setCell(1, 0, '=A1');
    sheet.setCell(2, 0, '=A2');

    expect(sheet.getCellDisplay(2, 0)).toBe('5');
  });

  it('should handle circular references gracefully', () => {
    const sheet = createSpreadsheet({ container, rows: 3, cols: 3 });

    sheet.setCell(0, 0, '=B1');
    sheet.setCell(0, 1, '=A1');

    const display = sheet.getCellDisplay(0, 0);
    expect(display).toContain('#REF!');
  });

  it('should return raw formula string from getCell', () => {
    const sheet = createSpreadsheet({ container, rows: 3, cols: 3 });

    sheet.setCell(0, 0, '=SUM(A2:A3)');
    expect(sheet.getCell(0, 0)).toBe('=SUM(A2:A3)');
  });

  it('should clean up DOM on destroy()', () => {
    const sheet = createSpreadsheet({ container, rows: 3, cols: 3 });

    sheet.destroy();

    expect(container.innerHTML).toBe('');
  });
});
