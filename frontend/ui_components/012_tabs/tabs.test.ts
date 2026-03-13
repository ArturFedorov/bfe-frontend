import { createTabs, TabOptions } from "./tabs";

function setupDOM() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  return container;
}

function teardownDOM(container: HTMLElement) {
  container.remove();
}

function getTabButtons(container: HTMLElement) {
  return Array.from(container.querySelectorAll("[data-tab-button]"));
}

function getContentPanel(container: HTMLElement) {
  return container.querySelector("[data-tab-content]");
}

const tabs = [
  { label: "Tab 1", content: "Content 1" },
  { label: "Tab 2", content: "Content 2" },
  { label: "Tab 3", content: "Content 3" },
];

describe("createTabs", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = setupDOM();
  });

  afterEach(() => {
    teardownDOM(container);
  });

  it("should render all tab buttons", () => {
    createTabs({ container, tabs });

    const buttons = getTabButtons(container);
    expect(buttons.length).toBe(3);
    expect(buttons[0].textContent).toContain("Tab 1");
    expect(buttons[1].textContent).toContain("Tab 2");
    expect(buttons[2].textContent).toContain("Tab 3");
  });

  it("should show the first tab content by default", () => {
    createTabs({ container, tabs });

    const content = getContentPanel(container);
    expect(content?.textContent).toContain("Content 1");
  });

  it("should activate a tab on click and show its content", () => {
    createTabs({ container, tabs });

    const buttons = getTabButtons(container);
    (buttons[1] as HTMLElement).click();

    const content = getContentPanel(container);
    expect(content?.textContent).toContain("Content 2");
    expect(buttons[1].classList.contains("active")).toBe(true);
  });

  it("should deactivate previous tab on click", () => {
    createTabs({ container, tabs });

    const buttons = getTabButtons(container);
    (buttons[1] as HTMLElement).click();

    expect(buttons[0].classList.contains("active")).toBe(false);
    expect(buttons[1].classList.contains("active")).toBe(true);
  });

  it("should navigate tabs with ArrowRight key", () => {
    createTabs({ container, tabs });

    const buttons = getTabButtons(container);
    const tabBar = buttons[0].parentElement!;

    (buttons[0] as HTMLElement).focus();
    tabBar.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })
    );

    const content = getContentPanel(container);
    expect(content?.textContent).toContain("Content 2");
  });

  it("should navigate tabs with ArrowLeft key and wrap around", () => {
    createTabs({ container, tabs });

    const buttons = getTabButtons(container);
    const tabBar = buttons[0].parentElement!;

    tabBar.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true })
    );

    const content = getContentPanel(container);
    expect(content?.textContent).toContain("Content 3");
  });

  it("should set active tab via setActive()", () => {
    const tabComponent = createTabs({ container, tabs });

    tabComponent.setActive(2);

    const content = getContentPanel(container);
    expect(content?.textContent).toContain("Content 3");
  });

  it("should return current active index via getActive()", () => {
    const tabComponent = createTabs({ container, tabs });

    expect(tabComponent.getActive()).toBe(0);

    tabComponent.setActive(2);
    expect(tabComponent.getActive()).toBe(2);
  });

  it("should respect defaultIndex option", () => {
    const tabComponent = createTabs({ container, tabs, defaultIndex: 1 });

    expect(tabComponent.getActive()).toBe(1);
    const content = getContentPanel(container);
    expect(content?.textContent).toContain("Content 2");
  });

  it("should clean up DOM on destroy()", () => {
    const tabComponent = createTabs({ container, tabs });

    tabComponent.destroy();

    expect(container.innerHTML).toBe("");
  });
});
