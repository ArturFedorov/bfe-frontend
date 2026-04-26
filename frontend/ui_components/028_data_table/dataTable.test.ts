/**
 * @jest-environment jsdom
 */
import {
  createDataTable,
  DataTableColumn,
  DataTableOptions,
} from './dataTable';

interface Row {
  name: string;
  age: number;
  [key: string]: string | number;
}

const COLUMNS: DataTableColumn[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'age', label: 'Age', sortable: true },
];

const DATA: Row[] = [
  { name: 'Alice', age: 30 },
  { name: 'Bob', age: 25 },
  { name: 'Carol', age: 30 },
];

function setup(overrides: Partial<DataTableOptions<Row>> = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const table = createDataTable<Row>({
    container,
    columns: COLUMNS,
    data: DATA,
    ...overrides,
  });
  return { container, table };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('createDataTable', () => {
  test('renders rows for each data entry', () => {
    const { container } = setup();
    expect(container.querySelectorAll('tbody tr').length).toBe(3);
  });

  test('clicking sortable header cycles sort direction', () => {
    const { container, table } = setup();
    const header = container.querySelector('th[data-key="age"]') as HTMLElement;
    header.click();
    expect(header.getAttribute('aria-sort')).toBe('ascending');
    expect(table.getRows()[0].age).toBe(25);
    header.click();
    expect(header.getAttribute('aria-sort')).toBe('descending');
    header.click();
    expect(header.getAttribute('aria-sort')).toBe('none');
  });

  test('sort is stable for equal values', () => {
    const { table } = setup();
    table.setSort({ column: 'age', direction: 'asc' });
    const rows = table.getRows();
    const thirties = rows.filter((r) => r.age === 30).map((r) => r.name);
    expect(thirties).toEqual(['Alice', 'Carol']);
  });

  test('filter restricts visible rows', () => {
    const { table } = setup();
    table.setFilter('bo');
    expect(table.getRows()).toEqual([{ name: 'Bob', age: 25 }]);
  });

  test('filter is case-insensitive', () => {
    const { table } = setup();
    table.setFilter('ALICE');
    expect(table.getRows().length).toBe(1);
  });

  test('setData replaces rows', () => {
    const { container, table } = setup();
    table.setData([{ name: 'Dan', age: 40 }]);
    expect(container.querySelectorAll('tbody tr').length).toBe(1);
  });

  test('aria-sort is "none" when not sorted', () => {
    const { container } = setup();
    const header = container.querySelector('th[data-key="age"]') as HTMLElement;
    expect(header.getAttribute('aria-sort')).toBe('none');
  });

  test('destroy removes elements', () => {
    const { container, table } = setup();
    table.destroy();
    expect(container.children.length).toBe(0);
  });
});
