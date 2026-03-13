import { getElementsByTagName } from "./getElementsByTagName";

function createElement(tag: string, children: any[] = []): any {
  return {
    tagName: tag.toUpperCase(),
    children,
  };
}

describe("getElementsByTagName", () => {
  it("should find elements by tag name", () => {
    const p1 = createElement("p");
    const p2 = createElement("p");
    const span = createElement("span");
    const root = createElement("div", [p1, span, p2]);

    const result = getElementsByTagName(root, "p");
    expect(result).toEqual([p1, p2]);
  });

  it("should be case insensitive", () => {
    const p = createElement("p");
    const root = createElement("div", [p]);

    expect(getElementsByTagName(root, "P")).toEqual([p]);
    expect(getElementsByTagName(root, "p")).toEqual([p]);
  });

  it("should find nested elements", () => {
    const deepP = createElement("p");
    const inner = createElement("span", [deepP]);
    const topP = createElement("p");
    const root = createElement("div", [topP, inner]);

    const result = getElementsByTagName(root, "p");
    expect(result).toEqual([topP, deepP]);
  });

  it("should return all elements with wildcard *", () => {
    const p = createElement("p");
    const span = createElement("span");
    const root = createElement("div", [p, span]);

    const result = getElementsByTagName(root, "*");
    expect(result).toEqual([p, span]);
  });

  it("should return empty array when no matches", () => {
    const p = createElement("p");
    const root = createElement("div", [p]);

    const result = getElementsByTagName(root, "a");
    expect(result).toEqual([]);
  });
});
