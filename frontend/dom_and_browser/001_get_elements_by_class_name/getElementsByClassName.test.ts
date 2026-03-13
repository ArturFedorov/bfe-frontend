import { getElementsByClassName } from "./getElementsByClassName";

function createElement(tag: string, classes: string[] = [], children: any[] = []): any {
  const el: any = {
    tagName: tag.toUpperCase(),
    classList: {
      contains(cls: string) {
        return classes.includes(cls);
      },
    },
    className: classes.join(" "),
    children,
  };
  return el;
}

describe("getElementsByClassName", () => {
  it("should find elements with the given class name", () => {
    const child1 = createElement("p", ["text"]);
    const child2 = createElement("span", ["other"]);
    const root = createElement("div", [], [child1, child2]);

    const result = getElementsByClassName(root, "text");
    expect(result).toEqual([child1]);
  });

  it("should find elements with multiple classes", () => {
    const child1 = createElement("p", ["text", "highlight"]);
    const child2 = createElement("span", ["text"]);
    const root = createElement("div", [], [child1, child2]);

    const result = getElementsByClassName(root, "highlight");
    expect(result).toEqual([child1]);
  });

  it("should find nested elements", () => {
    const nested = createElement("p", ["target"]);
    const middle = createElement("div", [], [nested]);
    const root = createElement("div", [], [middle]);

    const result = getElementsByClassName(root, "target");
    expect(result).toEqual([nested]);
  });

  it("should return empty array when no matches", () => {
    const child = createElement("p", ["other"]);
    const root = createElement("div", [], [child]);

    const result = getElementsByClassName(root, "missing");
    expect(result).toEqual([]);
  });

  it("should not include the root itself", () => {
    const root = createElement("div", ["target"]);

    const result = getElementsByClassName(root, "target");
    expect(result).toEqual([]);
  });
});
