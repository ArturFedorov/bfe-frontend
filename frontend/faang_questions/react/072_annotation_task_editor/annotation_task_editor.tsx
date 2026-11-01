import {FormEvent, ReactElement, ReactNode, useEffect, useId, useState} from 'react';

export type FieldSchema =
  | {
      kind: 'text';
      name: string;
      label: string;
      required?: boolean;
      pattern?: RegExp;
      patternMessage?: string;
    }
  | {
      kind: 'number';
      name: string;
      label: string;
      required?: boolean;
      min?: number;
      max?: number;
    }
  | {
      kind: 'select';
      name: string;
      label: string;
      required?: boolean;
      options: string[];
    }
  | { kind: 'checkbox'; name: string; label: string };

export type TaskValues = Record<string, string | number | boolean | undefined>;

export interface TaskEditorProps {
  schema: FieldSchema[];
  initialValues: TaskValues;
  onSave: (values: TaskValues) => Promise<void>;
  /** Called with the current values after `autosaveMs` of inactivity while dirty. */
  onDraft?: (values: TaskValues) => void;
  autosaveMs?: number; // default 1500
}

type Errors = Record<string, string | undefined>;
type SaveState = { status: 'idle' | 'saving' | 'saved' } | { status: 'error'; message: string };
const isBlank = (value: TaskValues[string])=>
  value === undefined || value === '' || (typeof value === 'string' && value.trim() === '');

function validate(schema: FieldSchema[], values: TaskValues): Errors {
  const errors: Errors = {};
  for(const field of schema) {
    const value = values[field.name];
    switch (field.kind) {
      case 'text':
        if(field.required && isBlank(value)) errors[field.name] = `${field.label} is required`;
        else if(field.pattern && !isBlank(value) && !field.pattern.test(String(value)))
          errors[field.name] = field.patternMessage ?? `${field.label} is invalid`;
        break;
      case 'number':
        if(field.required && isBlank(value)) {
          errors[field.name] = `${field.label} is required`;
        } else if(typeof value === 'number') {
          const belowMin = field.min !== undefined && value < field.min;
          const aboveMax = field.max !== undefined && value > field.max;
          if(belowMin || aboveMax) errors[field.name] = `Must be between ${field.min} and ${field.max} and ${aboveMax}`;
        }
        break;
      case 'select':
        if(field.required && isBlank(value)) errors[field.name] = `${field.label} is required`;
        break;
      case 'checkbox':
        break;
    }
  }

  return errors;
}

export function TaskEditor({
  schema,
  initialValues,
  onSave,
  onDraft,
  autosaveMs = 1500,
}: TaskEditorProps): ReactElement {
  const baseId = useId();
  const [baseline, setBaseline] = useState<TaskValues>(initialValues);
  const [values, setValues] = useState<TaskValues>(initialValues);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [save, setSave] = useState<SaveState>({ status: 'idle' });

  const errors = validate(schema, values);
  const hasErrors = schema.some((field) => errors[field.name] !== undefined);
  const isDirty = schema.some((field) => values[field.name] !== baseline[field.name]);
  const isSaving = save.status === 'saving';
  const setField = (name: string, value: TaskValues[string]) => {
    setValues((prev) => ({...prev, [name]: value }));
    if(save.status !== 'idle' && save.status !== 'saving') setSave({ status: 'idle' });
  }

  const touch = (name: string) => setTouched((prev) => ({...prev, [name]: true }))

  useEffect(() => {
    if(!isDirty || !onDraft) return;
    const id = setTimeout(() => onDraft(values), autosaveMs);
    return () => clearTimeout(id);
  }, [values, onDraft, isDirty, autosaveMs]);

  useEffect(() => {
    if(!isDirty) return;
    const guard = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [isDirty]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if(!isDirty || hasErrors || isSaving) return;
    setSave({ status: 'saving' });
    try {
      await onSave(values);
      setBaseline(values);
      setSave({ status: 'saved'});
    } catch (err: unknown) {
      setSave({ status: 'error', message: err instanceof Error ? err.message : String(err)});
    }
  }

  const renderField = (field: FieldSchema) => {
    const id = `${baseId}-${field.name}`;
    const errorId = `${id}-error`;
    const error = touched[field.name] ? errors[field.name] : undefined;
    const a11y = {
      id,
      name: field.name,
      'aria-invalid': error ? true : undefined,
      'aria-describedby': error ? errorId : undefined,
      onBlur: () => touch(field.name),
    }

    let control: ReactElement;
    switch (field.kind) {
      case 'text':
        control = (
          <input
            {...a11y}
            type="text"
            value={String(values[field.name]) ?? ''}
            onChange={(e) => setField(field.name, e.target.value)}
          />
        )
        break;
      case 'number':
        control = (
          <input
            {...a11y}
            type="number"
            value={typeof values[field.name] === 'number' ? (values[field.name] as number) : ''}
            onChange={(e) => setField(field.name, e.target.value === '' ? undefined : Number(e.target.value))}
          />
        )
        break;
      case 'select':
        control = (
          <select
            {...a11y}
            value={String(values[field.name] ?? '')}
            onChange={(e) => setField(field.name, e.target.value)}
          >
            {field.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )
        break;
      case 'checkbox':
        control = (
          <input
            id={id}
            name={field.name}
            type="checkbox"
            checked={Boolean(values[field.name])}
            onChange={(e) => setField(field.name, e.target.checked)}
          />
        );
        break;

    }

    return(
      <div key={field.name}>
        <label htmlFor={id}>{field.label}</label>
        {control}
        {error && <p id={errorId}>{error}</p>}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {schema.map(renderField)}
      <button type="submit" disabled={!isDirty || hasErrors || isSaving}>
        {isSaving ? 'Saving...' : 'Save'}
      </button>
      <div role="status">{save.status === 'saved' ? 'Saved' : ''}</div>
      {save.status === 'error' && <div role="alert">{save.message}</div>}
    </form>
  )
}
