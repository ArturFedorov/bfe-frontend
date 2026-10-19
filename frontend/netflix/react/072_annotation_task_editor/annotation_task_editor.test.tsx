/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskEditor, FieldSchema, TaskValues } from './annotation_task_editor';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const schema: FieldSchema[] = [
  { kind: 'text', name: 'name', label: 'Task name', required: true },
  {
    kind: 'text',
    name: 'url',
    label: 'Instructions URL',
    pattern: /^https:\/\//,
    patternMessage: 'Must start with https://',
  },
  { kind: 'number', name: 'batch', label: 'Items per batch', min: 1, max: 500 },
  { kind: 'select', name: 'vertical', label: 'Vertical', required: true, options: ['Siri', 'Photos', 'Maps'] },
  { kind: 'checkbox', name: 'expert', label: 'Requires expert review' },
];

const initialValues: TaskValues = {
  name: 'Label street signs',
  url: 'https://docs.example.com/signs',
  batch: 50,
  vertical: 'Maps',
  expert: false,
};

function describedBy(el: HTMLElement): HTMLElement | null {
  const id = el.getAttribute('aria-describedby');
  return id ? document.getElementById(id) : null;
}

function fireBeforeUnload(): boolean {
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}

describe('TaskEditor — schema rendering', () => {
  it('renders one labelled control per field, of the right type, prefilled from initialValues', () => {
    render(<TaskEditor schema={schema} initialValues={initialValues} onSave={jest.fn()} />);

    const name = screen.getByLabelText('Task name');
    expect(name).toHaveAttribute('type', 'text');
    expect(name).toHaveValue('Label street signs');
    expect(screen.getByRole('textbox', { name: 'Instructions URL' })).toHaveValue(
      'https://docs.example.com/signs'
    );
    expect(screen.getByRole('spinbutton', { name: 'Items per batch' })).toHaveValue(50);

    const vertical = screen.getByRole('combobox', { name: 'Vertical' });
    expect(vertical.tagName).toBe('SELECT');
    expect(vertical).toHaveValue('Maps');

    expect(screen.getByRole('checkbox', { name: 'Requires expert review' })).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });
});

describe('TaskEditor — validation', () => {
  it('does not validate on keystroke; shows a required error after blur with aria wiring', async () => {
    const user = userEvent.setup();
    render(<TaskEditor schema={schema} initialValues={initialValues} onSave={jest.fn()} />);

    const name = screen.getByLabelText('Task name');
    await user.clear(name);

    expect(name).not.toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByText('Task name is required')).not.toBeInTheDocument();

    await user.tab();

    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(describedBy(name)).toHaveTextContent('Task name is required');
  });

  it('reports pattern and number-range violations with the configured messages', async () => {
    const user = userEvent.setup();
    render(<TaskEditor schema={schema} initialValues={initialValues} onSave={jest.fn()} />);

    const url = screen.getByLabelText('Instructions URL');
    await user.clear(url);
    await user.type(url, 'http://insecure.example.com');
    expect(url).not.toHaveAttribute('aria-invalid', 'true');
    await user.tab();
    expect(url).toHaveAttribute('aria-invalid', 'true');
    expect(describedBy(url)).toHaveTextContent('Must start with https://');

    const batch = screen.getByLabelText('Items per batch');
    await user.clear(batch);
    await user.type(batch, '900');
    expect(batch).not.toHaveAttribute('aria-invalid', 'true');
    await user.tab();
    expect(batch).toHaveAttribute('aria-invalid', 'true');
    expect(describedBy(batch)).toHaveTextContent('Must be between 1 and 500');
  });

  it('re-validates a touched field live so the error clears as soon as it is valid', async () => {
    const user = userEvent.setup();
    render(<TaskEditor schema={schema} initialValues={initialValues} onSave={jest.fn()} />);

    const name = screen.getByLabelText('Task name');
    await user.clear(name);
    await user.tab();
    expect(name).toHaveAttribute('aria-invalid', 'true');

    // typing (no blur) clears the error once the value is valid again
    await user.type(name, 'N');
    expect(name).not.toHaveAttribute('aria-invalid', 'true');
    expect(name).not.toHaveAttribute('aria-describedby');
    expect(screen.queryByText('Task name is required')).not.toBeInTheDocument();
  });
});

describe('TaskEditor — dirty tracking and Save state', () => {
  it('disables Save until the form is dirty and valid; reverting makes it pristine again', async () => {
    const user = userEvent.setup();
    render(<TaskEditor schema={schema} initialValues={initialValues} onSave={jest.fn()} />);

    const save = screen.getByRole('button', { name: 'Save' });
    expect(save).toBeDisabled();

    const name = screen.getByLabelText('Task name');
    await user.type(name, '!');
    expect(save).toBeEnabled();

    await user.type(name, '{backspace}');
    expect(name).toHaveValue('Label street signs');
    expect(save).toBeDisabled();

    // dirty but invalid → still disabled, even before the field is blurred
    await user.clear(name);
    expect(save).toBeDisabled();
    await user.type(name, 'Valid again');
    expect(save).toBeEnabled();
  });

  it('tracks dirtiness across select and checkbox fields too', async () => {
    const user = userEvent.setup();
    render(<TaskEditor schema={schema} initialValues={initialValues} onSave={jest.fn()} />);

    const save = screen.getByRole('button', { name: 'Save' });
    await user.selectOptions(screen.getByLabelText('Vertical'), 'Photos');
    expect(save).toBeEnabled();
    await user.selectOptions(screen.getByLabelText('Vertical'), 'Maps');
    expect(save).toBeDisabled();

    await user.click(screen.getByLabelText('Requires expert review'));
    expect(save).toBeEnabled();
    await user.click(screen.getByLabelText('Requires expert review'));
    expect(save).toBeDisabled();
  });
});

describe('TaskEditor — submit', () => {
  it('calls onSave once, shows Saving… while pending, then Saved and resets the baseline', async () => {
    const user = userEvent.setup();
    const d = deferred<void>();
    const onSave = jest.fn(() => d.promise);
    render(<TaskEditor schema={schema} initialValues={initialValues} onSave={onSave} />);

    await user.selectOptions(screen.getByLabelText('Vertical'), 'Siri');
    await user.click(screen.getByLabelText('Requires expert review'));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({ ...initialValues, vertical: 'Siri', expert: true });

    const pending = screen.getByRole('button', { name: 'Saving…' });
    expect(pending).toBeDisabled();
    expect(screen.getByLabelText('Vertical')).toHaveValue('Siri');
    expect(screen.getByLabelText('Requires expert review')).toBeChecked();

    await act(async () => {
      d.resolve();
    });

    expect(screen.getByRole('status')).toHaveTextContent('Saved');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    // saved values are the new baseline → not dirty → Save disabled
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.getByLabelText('Vertical')).toHaveValue('Siri');
  });

  it('on rejection shows an alert with the message, keeps values, and re-enables Save', async () => {
    const user = userEvent.setup();
    const d = deferred<void>();
    const onSave = jest.fn(() => d.promise);
    render(<TaskEditor schema={schema} initialValues={initialValues} onSave={onSave} />);

    const name = screen.getByLabelText('Task name');
    await user.clear(name);
    await user.type(name, 'Label crosswalks');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();

    await act(async () => {
      d.reject(new Error('Version conflict'));
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Version conflict');
    expect(name).toHaveValue('Label crosswalks');
    expect(screen.getByRole('status')).not.toHaveTextContent('Saved');
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});

describe('TaskEditor — debounced autosave', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  const advance = (ms: number) =>
    act(() => {
      jest.advanceTimersByTime(ms);
    });

  it('fires onDraft once after autosaveMs of inactivity, debounced not throttled', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onDraft = jest.fn();
    render(
      <TaskEditor
        schema={schema}
        initialValues={initialValues}
        onSave={jest.fn()}
        onDraft={onDraft}
        autosaveMs={1500}
      />
    );

    const name = screen.getByLabelText('Task name');
    await user.type(name, ' A');
    advance(1000);
    await user.type(name, 'B'); // activity resets the timer
    advance(1000); // 2000ms since first change, 1000ms since last → throttle would have fired
    expect(onDraft).not.toHaveBeenCalled();

    advance(499);
    expect(onDraft).not.toHaveBeenCalled();
    advance(1);
    expect(onDraft).toHaveBeenCalledTimes(1);
    expect(onDraft).toHaveBeenCalledWith({ ...initialValues, name: 'Label street signs AB' });

    // quiet period with no further changes → no repeat
    advance(10000);
    expect(onDraft).toHaveBeenCalledTimes(1);
  });

  it('does not fire when the form is not dirty (pristine, or reverted before the deadline)', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onDraft = jest.fn();
    render(
      <TaskEditor schema={schema} initialValues={initialValues} onSave={jest.fn()} onDraft={onDraft} />
    );

    advance(5000);
    expect(onDraft).not.toHaveBeenCalled();

    const name = screen.getByLabelText('Task name');
    await user.type(name, '!');
    advance(1000);
    await user.type(name, '{backspace}'); // back to the initial value
    advance(5000);
    expect(onDraft).not.toHaveBeenCalled();
  });

  it('cancels a pending autosave on unmount', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onDraft = jest.fn();
    const { unmount } = render(
      <TaskEditor schema={schema} initialValues={initialValues} onSave={jest.fn()} onDraft={onDraft} />
    );

    await user.type(screen.getByLabelText('Task name'), '!');
    unmount();
    advance(5000);
    expect(onDraft).not.toHaveBeenCalled();
  });
});

describe('TaskEditor — unsaved-changes guard', () => {
  it('prevents beforeunload only while dirty', async () => {
    const user = userEvent.setup();
    const d = deferred<void>();
    render(<TaskEditor schema={schema} initialValues={initialValues} onSave={() => d.promise} />);

    expect(fireBeforeUnload()).toBe(false);

    const name = screen.getByLabelText('Task name');
    await user.type(name, '!');
    expect(fireBeforeUnload()).toBe(true);

    await user.type(name, '{backspace}');
    expect(fireBeforeUnload()).toBe(false);

    // dirty again, then a successful save clears the guard
    await user.type(name, '?');
    expect(fireBeforeUnload()).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await act(async () => {
      d.resolve();
    });
    expect(fireBeforeUnload()).toBe(false);
  });
});
