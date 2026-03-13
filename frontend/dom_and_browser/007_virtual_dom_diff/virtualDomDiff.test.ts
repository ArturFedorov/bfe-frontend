import { diff, VNode } from "./virtualDomDiff";

function vnode(
  type: string,
  props: Record<string, any> = {},
  children: (VNode | string)[] = []
): VNode {
  return { type, props, children };
}

describe("diff", () => {
  it("should return null for identical nodes", () => {
    const tree = vnode("div", { class: "a" });
    expect(diff(tree, tree)).toBeNull();
  });

  it("should return REPLACE when types differ", () => {
    const oldTree = vnode("div");
    const newTree = vnode("span");
    const patch = diff(oldTree, newTree);
    expect(patch).toEqual({ type: "REPLACE", node: newTree });
  });

  it("should return CREATE when old is null", () => {
    const newTree = vnode("div");
    const patch = diff(null, newTree);
    expect(patch).toEqual({ type: "CREATE", node: newTree });
  });

  it("should return REMOVE when new is null", () => {
    const oldTree = vnode("div");
    const patch = diff(oldTree, null);
    expect(patch).toEqual({ type: "REMOVE" });
  });

  it("should detect prop changes with UPDATE", () => {
    const oldTree = vnode("div", { class: "old" });
    const newTree = vnode("div", { class: "new" });
    const patch = diff(oldTree, newTree);
    expect(patch).not.toBeNull();
    expect(patch!.type).toBe("UPDATE");
    if (patch!.type === "UPDATE") {
      expect(patch!.props).toEqual({ class: "new" });
    }
  });

  it("should diff children", () => {
    const oldTree = vnode("div", {}, [vnode("p")]);
    const newTree = vnode("div", {}, [vnode("p"), vnode("span")]);
    const patch = diff(oldTree, newTree);
    expect(patch).not.toBeNull();
    expect(patch!.type).toBe("UPDATE");
    if (patch!.type === "UPDATE") {
      expect(patch!.children.length).toBeGreaterThan(0);
    }
  });

  it("should REPLACE when string node changes", () => {
    const patch = diff("hello", "world");
    expect(patch).toEqual({ type: "REPLACE", node: "world" });
  });

  it("should return null for identical strings", () => {
    expect(diff("hello", "hello")).toBeNull();
  });
});
