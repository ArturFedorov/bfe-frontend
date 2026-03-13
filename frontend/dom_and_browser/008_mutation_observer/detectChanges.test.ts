import { detectChanges } from "./detectChanges";

describe("detectChanges", () => {
  it("should return empty array when objects are identical", () => {
    const obj = { a: 1, b: 2 };
    expect(detectChanges(obj, { ...obj })).toEqual([]);
  });

  it("should detect added properties", () => {
    const changes = detectChanges({ a: 1 }, { a: 1, b: 2 });
    expect(changes).toEqual([
      { type: "add", path: "b", newValue: 2 },
    ]);
  });

  it("should detect removed properties", () => {
    const changes = detectChanges({ a: 1, b: 2 }, { a: 1 });
    expect(changes).toEqual([
      { type: "remove", path: "b", oldValue: 2 },
    ]);
  });

  it("should detect updated properties", () => {
    const changes = detectChanges({ a: 1 }, { a: 2 });
    expect(changes).toEqual([
      { type: "update", path: "a", oldValue: 1, newValue: 2 },
    ]);
  });

  it("should detect nested changes", () => {
    const changes = detectChanges(
      { user: { name: "Alice", age: 30 } },
      { user: { name: "Bob", age: 30 } }
    );
    expect(changes).toEqual([
      { type: "update", path: "user.name", oldValue: "Alice", newValue: "Bob" },
    ]);
  });

  it("should detect array value changes", () => {
    const changes = detectChanges(
      { items: [1, 2, 3] },
      { items: [1, 2, 4] }
    );
    expect(changes.length).toBe(1);
    expect(changes[0].type).toBe("update");
    expect(changes[0].path).toBe("items");
  });
});
