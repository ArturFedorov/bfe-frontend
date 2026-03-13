import { delegate } from "./delegate";

function createMockParent() {
  const listeners: Record<string, Function[]> = {};
  return {
    addEventListener(type: string, fn: Function) {
      if (!listeners[type]) listeners[type] = [];
      listeners[type].push(fn);
    },
    removeEventListener(type: string, fn: Function) {
      if (listeners[type]) {
        listeners[type] = listeners[type].filter((f) => f !== fn);
      }
    },
    trigger(type: string, event: any) {
      (listeners[type] || []).forEach((fn) => fn(event));
    },
    getListeners(type: string) {
      return listeners[type] || [];
    },
  };
}

function createMockElement(matches: boolean, parent: any = null) {
  return {
    matches: jest.fn(() => matches),
    parentNode: parent,
  };
}

describe("delegate", () => {
  it("should call handler when matching child is clicked", () => {
    const parent = createMockParent();
    const handler = jest.fn();
    delegate(parent, ".btn", "click", handler);

    const target = createMockElement(true, parent);
    parent.trigger("click", { target });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("should not call handler when non-matching element is clicked", () => {
    const parent = createMockParent();
    const handler = jest.fn();
    delegate(parent, ".btn", "click", handler);

    const target = createMockElement(false, parent);
    parent.trigger("click", { target });

    expect(handler).not.toHaveBeenCalled();
  });

  it("should stop delegation after remove() is called", () => {
    const parent = createMockParent();
    const handler = jest.fn();
    const { remove } = delegate(parent, ".btn", "click", handler);

    remove();

    const target = createMockElement(true, parent);
    parent.trigger("click", { target });

    expect(handler).not.toHaveBeenCalled();
    expect(parent.getListeners("click")).toHaveLength(0);
  });

  it("should match nested elements by walking up to parent", () => {
    const parent = createMockParent();
    const handler = jest.fn();
    delegate(parent, ".btn", "click", handler);

    const matchingAncestor = createMockElement(true, parent);
    const target = createMockElement(false, matchingAncestor);
    parent.trigger("click", { target });

    expect(handler).toHaveBeenCalledTimes(1);
  });
});
