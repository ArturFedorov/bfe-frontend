/**
 * @jest-environment jsdom
 */
import { createOtpInput, OtpInputOptions } from './otpInput';

function setup(overrides: Partial<OtpInputOptions> = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const onChange = jest.fn();
  const onComplete = jest.fn();
  const otp = createOtpInput({
    container,
    onChange,
    onComplete,
    ...overrides,
  });
  const cells = () =>
    Array.from(container.querySelectorAll('input')) as HTMLInputElement[];
  return { container, otp, onChange, onComplete, cells };
}

function type(input: HTMLInputElement, value: string) {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('createOtpInput', () => {
  test('renders 6 cells by default', () => {
    const { cells } = setup();
    expect(cells().length).toBe(6);
  });

  test('renders configurable length', () => {
    const { cells } = setup({ length: 4 });
    expect(cells().length).toBe(4);
  });

  test('cells have inputmode=numeric and maxlength=1', () => {
    const { cells } = setup();
    const c = cells()[0];
    expect(c.getAttribute('inputmode')).toBe('numeric');
    expect(c.getAttribute('maxlength')).toBe('1');
  });

  test('typing a digit auto-advances focus', () => {
    const { cells } = setup();
    const all = cells();
    all[0].focus();
    type(all[0], '1');
    expect(document.activeElement).toBe(all[1]);
  });

  test('non-numeric input is rejected', () => {
    const { cells, otp } = setup();
    const all = cells();
    all[0].focus();
    type(all[0], 'a');
    expect(otp.getValue()).toBe('');
  });

  test('backspace on empty cell moves focus back', () => {
    const { cells } = setup();
    const all = cells();
    all[1].focus();
    all[1].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }),
    );
    expect(document.activeElement).toBe(all[0]);
  });

  test('arrow keys navigate', () => {
    const { cells } = setup();
    const all = cells();
    all[0].focus();
    all[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    expect(document.activeElement).toBe(all[1]);
  });

  test('paste distributes characters across cells', () => {
    const { container, otp, cells } = setup();
    const all = cells();
    all[0].focus();
    const event = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'clipboardData', {
      value: { getData: () => '123456' },
    });
    container.dispatchEvent(event);
    expect(otp.getValue()).toBe('123456');
  });

  test('setValue populates cells', () => {
    const { otp, cells } = setup();
    otp.setValue('1234');
    expect(cells()[0].value).toBe('1');
    expect(cells()[3].value).toBe('4');
  });

  test('getValue returns joined string', () => {
    const { otp } = setup();
    otp.setValue('1234');
    expect(otp.getValue()).toBe('1234');
  });

  test('onComplete fires when all cells are filled', () => {
    const { otp, onComplete } = setup({ length: 3 });
    otp.setValue('123');
    expect(onComplete).toHaveBeenCalledWith('123');
  });

  test('clear empties all cells', () => {
    const { otp, cells } = setup();
    otp.setValue('1234');
    otp.clear();
    expect(otp.getValue()).toBe('');
    expect(cells()[0].value).toBe('');
  });

  test('destroy removes elements', () => {
    const { container, otp } = setup();
    otp.destroy();
    expect(container.children.length).toBe(0);
  });
});
