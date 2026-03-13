import { createTable, TableOptions } from "./dynamicTable";

function setupDOM() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  return container;
}

function teardownDOM(container: HTMLElement) {
  container.remove();
}

function getHeaderCells(container: HTMLElement) {
  return Array.from(container.querySelectorAll("th"));
}

function getBodyRows(container: HTMLElement) {
  return Array.from(container.querySelectorAll("tbody tr"));
}

function getCellsInRow(row: Element) {
  return Array.from(row.querySelectorAll("td")).map((td) => td.textContent);
}

const columns = ["name", "age", "city"];
const data = [
  { name: "Alice", age: 30, city: "NYC" },
  { name: "Bob", age: 25, city: "LA" },
  { name: "Charlie", age: 35, city: "Chicago" },
];

describe("createTable", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = setupDOM();
  });

  afterEach(() => {
    teardownDOM(container);
  });

  it("should render table headers from columns", () => {
    createTable({ container, columns, data: [] });

    const headers = getHeaderCells(container);
    expect(headers.length).toBe(3);
    expect(headers[0].textContent).toBe("name");
    expect(headers[1].textContent).toBe("age");
    expect(headers[2].textContent).toBe("city");
  });

  it("should render data rows", () => {
    createTable({ container, columns, data });

    const rows = getBodyRows(container);
    expect(rows.length).toBe(3);
    expect(getCellsInRow(rows[0])).toEqual(["Alice", "30", "NYC"]);
    expect(getCellsInRow(rows[1])).toEqual(["Bob", "25", "LA"]);
  });

  it("should add a row with addRow()", () => {
    const table = createTable({ container, columns, data: [...data] });

    table.addRow({ name: "Diana", age: 28, city: "Seattle" });

    const rows = getBodyRows(container);
    expect(rows.length).toBe(4);
    expect(getCellsInRow(rows[3])).toEqual(["Diana", "28", "Seattle"]);
  });

  it("should remove a row with removeRow()", () => {
    const table = createTable({ container, columns, data: [...data] });

    table.removeRow(1);

    const rows = getBodyRows(container);
    expect(rows.length).toBe(2);
    expect(getCellsInRow(rows[0])).toEqual(["Alice", "30", "NYC"]);
    expect(getCellsInRow(rows[1])).toEqual(["Charlie", "35", "Chicago"]);
  });

  it("should return current data via getData()", () => {
    const dataCopy = data.map((d) => ({ ...d }));
    const table = createTable({ container, columns, data: dataCopy });

    const result = table.getData();
    expect(result.length).toBe(3);
    expect(result[0].name).toBe("Alice");
  });

  it("should update getData() after addRow and removeRow", () => {
    const table = createTable({ container, columns, data: [...data] });

    table.addRow({ name: "Diana", age: 28, city: "Seattle" });
    expect(table.getData().length).toBe(4);

    table.removeRow(0);
    expect(table.getData().length).toBe(3);
    expect(table.getData()[0].name).toBe("Bob");
  });

  it("should sort by column ascending", () => {
    const table = createTable({ container, columns, data: [...data] });

    table.sort("age", "asc");

    const rows = getBodyRows(container);
    expect(getCellsInRow(rows[0])).toEqual(["Bob", "25", "LA"]);
    expect(getCellsInRow(rows[1])).toEqual(["Alice", "30", "NYC"]);
    expect(getCellsInRow(rows[2])).toEqual(["Charlie", "35", "Chicago"]);
  });

  it("should sort by column descending", () => {
    const table = createTable({ container, columns, data: [...data] });

    table.sort("name", "desc");

    const rows = getBodyRows(container);
    expect(getCellsInRow(rows[0])[0]).toBe("Charlie");
    expect(getCellsInRow(rows[1])[0]).toBe("Bob");
    expect(getCellsInRow(rows[2])[0]).toBe("Alice");
  });

  it("should clean up DOM on destroy()", () => {
    const table = createTable({ container, columns, data });

    table.destroy();

    expect(container.innerHTML).toBe("");
  });
});
