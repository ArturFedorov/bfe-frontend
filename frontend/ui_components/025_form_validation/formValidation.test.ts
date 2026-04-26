/**
 * @jest-environment jsdom
 */
import {
  createValidatedForm,
  FormValidationOptions,
  Validator,
} from './formValidation';

function makeForm() {
  document.body.innerHTML = `
    <form>
      <input name="email" />
      <span data-error-for="email"></span>
      <input name="password" type="password" />
      <span data-error-for="password"></span>
      <input name="confirm" type="password" />
      <span data-error-for="confirm"></span>
      <button type="submit">Submit</button>
    </form>
  `;
  return document.querySelector('form') as HTMLFormElement;
}

const emailValidator: Validator = (v) =>
  v.includes('@') ? null : 'Invalid email';
const minLength: Validator = (v) => (v.length >= 8 ? null : 'Min 8 chars');
const matchPassword: Validator = (v, all) =>
  v === all.password ? null : 'Passwords must match';

function setup(overrides: Partial<FormValidationOptions> = {}) {
  const form = makeForm();
  const onSubmit = jest.fn();
  const schema: Record<string, Validator[]> = {
    email: [emailValidator],
    password: [minLength],
    confirm: [matchPassword],
  };
  const instance = createValidatedForm({
    form,
    schema,
    onSubmit,
    ...overrides,
  });
  return { form, instance, onSubmit };
}

function setValue(form: HTMLFormElement, name: string, value: string) {
  const input = form.elements.namedItem(name) as HTMLInputElement;
  input.value = value;
  return input;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('createValidatedForm', () => {
  test('validate returns false when fields are empty', () => {
    const { instance } = setup();
    expect(instance.validate()).toBe(false);
  });

  test('validate returns true when all fields pass', () => {
    const { form, instance } = setup();
    setValue(form, 'email', 'a@b.com');
    setValue(form, 'password', 'password1');
    setValue(form, 'confirm', 'password1');
    expect(instance.validate()).toBe(true);
  });

  test('blur shows error for invalid field', () => {
    const { form } = setup();
    const input = setValue(form, 'email', 'no-at');
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    const err = form.querySelector('[data-error-for="email"]') as HTMLElement;
    expect(err.textContent).toBe('Invalid email');
  });

  test('error nodes have aria-live=polite', () => {
    const { form } = setup();
    const err = form.querySelector('[data-error-for="email"]') as HTMLElement;
    expect(err.getAttribute('aria-live')).toBe('polite');
  });

  test('submit blocked when invalid', () => {
    const { form, onSubmit } = setup();
    form.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('submit fires onSubmit when valid', () => {
    const { form, onSubmit } = setup();
    setValue(form, 'email', 'a@b.com');
    setValue(form, 'password', 'password1');
    setValue(form, 'confirm', 'password1');
    form.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    expect(onSubmit).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'password1',
      confirm: 'password1',
    });
  });

  test('dependent field re-validates when its dependency changes', () => {
    const { form, instance } = setup();
    setValue(form, 'password', 'password1');
    const confirm = setValue(form, 'confirm', 'password1');
    confirm.dispatchEvent(new Event('blur', { bubbles: true }));
    setValue(form, 'password', 'changed11');
    const pwd = form.elements.namedItem('password') as HTMLInputElement;
    pwd.dispatchEvent(new Event('blur', { bubbles: true }));
    expect(instance.getErrors().confirm).toBe('Passwords must match');
  });

  test('getValues returns current values', () => {
    const { form, instance } = setup();
    setValue(form, 'email', 'a@b.com');
    expect(instance.getValues().email).toBe('a@b.com');
  });

  test('destroy removes listeners', () => {
    const { form, instance, onSubmit } = setup();
    instance.destroy();
    setValue(form, 'email', 'a@b.com');
    setValue(form, 'password', 'password1');
    setValue(form, 'confirm', 'password1');
    form.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
