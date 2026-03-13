import { createFormWizard, FormWizardOptions, WizardStep } from "./formWizard";

function setupDOM() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  return container;
}

function teardownDOM(container: HTMLElement) {
  container.remove();
}

function getInputs(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll("input")
  ) as HTMLInputElement[];
}

function getStepTitle(container: HTMLElement) {
  return container.querySelector("[data-step-title]")?.textContent ?? "";
}

function setInputValue(container: HTMLElement, name: string, value: string) {
  const input = container.querySelector(
    `input[name="${name}"]`
  ) as HTMLInputElement | null;
  if (input) {
    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

const steps: WizardStep[] = [
  {
    title: "Personal Info",
    fields: [
      { name: "firstName", type: "text", required: true },
      { name: "lastName", type: "text", required: true },
    ],
  },
  {
    title: "Contact",
    fields: [
      { name: "email", type: "email", required: true },
      { name: "phone", type: "tel" },
    ],
  },
  {
    title: "Review",
    fields: [{ name: "notes", type: "text" }],
  },
];

describe("createFormWizard", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = setupDOM();
  });

  afterEach(() => {
    teardownDOM(container);
  });

  it("should render the first step", () => {
    createFormWizard({ container, steps, onSubmit: jest.fn() });

    expect(getStepTitle(container)).toContain("Personal Info");
    const inputs = getInputs(container);
    expect(inputs.length).toBe(2);
    expect(inputs[0].name).toBe("firstName");
    expect(inputs[1].name).toBe("lastName");
  });

  it("should advance to next step when required fields are filled", () => {
    const wizard = createFormWizard({
      container,
      steps,
      onSubmit: jest.fn(),
    });

    setInputValue(container, "firstName", "John");
    setInputValue(container, "lastName", "Doe");

    const result = wizard.next();
    expect(result).toBe(true);
    expect(wizard.getCurrentStep()).toBe(1);
    expect(getStepTitle(container)).toContain("Contact");
  });

  it("should block next when required fields are empty", () => {
    const wizard = createFormWizard({
      container,
      steps,
      onSubmit: jest.fn(),
    });

    const result = wizard.next();
    expect(result).toBe(false);
    expect(wizard.getCurrentStep()).toBe(0);
  });

  it("should go back to previous step with prev()", () => {
    const wizard = createFormWizard({
      container,
      steps,
      onSubmit: jest.fn(),
    });

    setInputValue(container, "firstName", "John");
    setInputValue(container, "lastName", "Doe");
    wizard.next();

    expect(wizard.getCurrentStep()).toBe(1);

    wizard.prev();
    expect(wizard.getCurrentStep()).toBe(0);
    expect(getStepTitle(container)).toContain("Personal Info");
  });

  it("should collect data across all steps via getData()", () => {
    const wizard = createFormWizard({
      container,
      steps,
      onSubmit: jest.fn(),
    });

    setInputValue(container, "firstName", "John");
    setInputValue(container, "lastName", "Doe");
    wizard.next();

    setInputValue(container, "email", "john@test.com");
    setInputValue(container, "phone", "555-1234");
    wizard.next();

    const data = wizard.getData();
    expect(data.firstName).toBe("John");
    expect(data.lastName).toBe("Doe");
    expect(data.email).toBe("john@test.com");
    expect(data.phone).toBe("555-1234");
  });

  it("should call onSubmit on final step next()", () => {
    const onSubmit = jest.fn();
    const wizard = createFormWizard({ container, steps, onSubmit });

    setInputValue(container, "firstName", "John");
    setInputValue(container, "lastName", "Doe");
    wizard.next();

    setInputValue(container, "email", "john@test.com");
    wizard.next();

    setInputValue(container, "notes", "All good");
    wizard.next();

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: "John",
        lastName: "Doe",
        email: "john@test.com",
      })
    );
  });

  it("should return correct step index via getCurrentStep()", () => {
    const wizard = createFormWizard({
      container,
      steps,
      onSubmit: jest.fn(),
    });

    expect(wizard.getCurrentStep()).toBe(0);

    setInputValue(container, "firstName", "A");
    setInputValue(container, "lastName", "B");
    wizard.next();
    expect(wizard.getCurrentStep()).toBe(1);
  });

  it("should clean up DOM on destroy()", () => {
    const wizard = createFormWizard({
      container,
      steps,
      onSubmit: jest.fn(),
    });

    wizard.destroy();

    expect(container.innerHTML).toBe("");
  });
});
