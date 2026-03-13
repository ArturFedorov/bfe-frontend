import { createSlider, SliderOptions } from "./slider";

function setupDOM() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  return container;
}

function teardownDOM(container: HTMLElement) {
  container.remove();
}

function getTrack(container: HTMLElement) {
  return container.querySelector("[data-slider-track]") as HTMLElement | null;
}

function getThumb(container: HTMLElement) {
  return container.querySelector("[data-slider-thumb]") as HTMLElement | null;
}

describe("createSlider", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = setupDOM();
  });

  afterEach(() => {
    teardownDOM(container);
  });

  it("should render a track and thumb", () => {
    createSlider({ container });

    expect(getTrack(container)).not.toBeNull();
    expect(getThumb(container)).not.toBeNull();
  });

  it("should use initialValue", () => {
    const slider = createSlider({ container, initialValue: 50 });

    expect(slider.getValue()).toBe(50);
  });

  it("should default to min value when no initialValue", () => {
    const slider = createSlider({ container, min: 10, max: 90 });

    expect(slider.getValue()).toBe(10);
  });

  it("should return current value via getValue()", () => {
    const slider = createSlider({ container, initialValue: 30 });

    expect(slider.getValue()).toBe(30);
  });

  it("should update value via setValue()", () => {
    const slider = createSlider({ container, min: 0, max: 100 });

    slider.setValue(75);
    expect(slider.getValue()).toBe(75);
  });

  it("should clamp value to min", () => {
    const slider = createSlider({ container, min: 10, max: 90 });

    slider.setValue(5);
    expect(slider.getValue()).toBe(10);
  });

  it("should clamp value to max", () => {
    const slider = createSlider({ container, min: 10, max: 90 });

    slider.setValue(100);
    expect(slider.getValue()).toBe(90);
  });

  it("should snap to nearest step", () => {
    const slider = createSlider({
      container,
      min: 0,
      max: 100,
      step: 10,
    });

    slider.setValue(27);
    expect(slider.getValue()).toBe(30);
  });

  it("should call onChange when value changes via setValue", () => {
    const onChange = jest.fn();
    const slider = createSlider({ container, onChange });

    slider.setValue(50);
    expect(onChange).toHaveBeenCalledWith(50);
  });

  it("should not call onChange when setValue sets same value", () => {
    const onChange = jest.fn();
    const slider = createSlider({ container, initialValue: 50, onChange });

    slider.setValue(50);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("should simulate drag changing value", () => {
    const onChange = jest.fn();
    createSlider({ container, min: 0, max: 100, onChange });

    const track = getTrack(container)!;
    const thumb = getThumb(container)!;

    Object.defineProperty(track, "getBoundingClientRect", {
      value: () => ({
        left: 0,
        right: 200,
        width: 200,
        top: 0,
        bottom: 20,
        height: 20,
      }),
    });

    thumb.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    document.dispatchEvent(
      new MouseEvent("mousemove", { clientX: 100, bubbles: true })
    );
    document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));

    expect(onChange).toHaveBeenCalledWith(50);
  });

  it("should clean up DOM on destroy()", () => {
    const slider = createSlider({ container });

    slider.destroy();

    expect(container.innerHTML).toBe("");
  });
});
