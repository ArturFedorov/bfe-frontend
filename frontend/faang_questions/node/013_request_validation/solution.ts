/**
 * Reference solution for 013 — request validation.
 *
 * Each section is validated independently into `{ data, errors }`; the
 * wrapper concatenates errors (body first, then query) and only calls the
 * handler when there are none.
 */
export interface ApiRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  body?: unknown;
}

export interface ApiResponse {
  status: number;
  headers?: Record<string, string>;
  body?: unknown;
}

export type Handler = (req: ApiRequest) => ApiResponse | Promise<ApiResponse>;

export type FieldType = 'string' | 'number' | 'boolean';

export interface FieldSpec {
  type: FieldType;
  required?: boolean;
}

export interface ValidationSchema {
  body?: Record<string, FieldSpec>;
  query?: Record<string, FieldSpec>;
}

export interface FieldError {
  path: string;
  code: 'required' | 'invalid_type' | 'unknown_field' | 'not_coercible';
  message: string;
}

export interface ValidatedData {
  body: Record<string, unknown>;
  query: Record<string, unknown>;
}

export type ValidatedHandler = (
  req: ApiRequest,
  data: ValidatedData,
) => ApiResponse | Promise<ApiResponse>;

type Section = 'body' | 'query';

interface SectionResult {
  data: Record<string, unknown>;
  errors: FieldError[];
}

type FieldOutcome =
  | { ok: true; value: unknown }
  | { ok: false; error: FieldError };

type FieldCheck = (
  path: string,
  value: unknown,
  spec: FieldSpec,
) => FieldOutcome;

const NUMBER_PATTERN = /^-?\d+(\.\d+)?$/;

const checkBodyField: FieldCheck = (path, value, spec) =>
  typeof value === spec.type
    ? { ok: true, value }
    : {
        ok: false,
        error: {
          path,
          code: 'invalid_type',
          message: `Expected ${spec.type}, received ${typeof value}`,
        },
      };

function coerceQueryValue(raw: string, type: FieldType): unknown {
  if (type === 'string') return raw;
  if (type === 'number')
    return NUMBER_PATTERN.test(raw) ? Number(raw) : undefined;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return undefined;
}

const checkQueryField: FieldCheck = (path, value, spec) => {
  const coerced = coerceQueryValue(String(value), spec.type);
  return coerced === undefined
    ? {
        ok: false,
        error: {
          path,
          code: 'not_coercible',
          message: `Cannot coerce '${String(value)}' to ${spec.type}`,
        },
      }
    : { ok: true, value: coerced };
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function validateSection(
  section: Section,
  fields: Record<string, FieldSpec>,
  input: Record<string, unknown>,
  check: FieldCheck,
): SectionResult {
  const data: Record<string, unknown> = {};
  const errors: FieldError[] = [];

  for (const [name, spec] of Object.entries(fields)) {
    const path = `${section}.${name}`;
    if (!Object.hasOwn(input, name) || input[name] === undefined) {
      if (spec.required) {
        errors.push({ path, code: 'required', message: `${path} is required` });
      }
      continue;
    }

    const outcome = check(path, input[name], spec);
    if (outcome.ok) data[name] = outcome.value;
    else errors.push(outcome.error);
  }

  for (const name of Object.keys(input)) {
    if (!Object.hasOwn(fields, name)) {
      const path = `${section}.${name}`;
      errors.push({
        path,
        code: 'unknown_field',
        message: `${path} is not allowed`,
      });
    }
  }

  return { data, errors };
}

function validateBody(
  fields: Record<string, FieldSpec> | undefined,
  body: unknown,
): SectionResult {
  if (fields === undefined) return { data: {}, errors: [] };
  if (!isPlainObject(body)) {
    return {
      data: {},
      errors: [
        {
          path: 'body',
          code: 'invalid_type',
          message: 'Expected body to be an object',
        },
      ],
    };
  }
  return validateSection('body', fields, body, checkBodyField);
}

function validateQuery(
  fields: Record<string, FieldSpec> | undefined,
  query: Record<string, string>,
): SectionResult {
  if (fields === undefined) return { data: {}, errors: [] };
  return validateSection('query', fields, query, checkQueryField);
}

export function withValidation(
  schema: ValidationSchema,
  handler: ValidatedHandler,
): Handler {
  return (req) => {
    const body = validateBody(schema.body, req.body);
    const query = validateQuery(schema.query, req.query);
    const errors = [...body.errors, ...query.errors];

    if (errors.length > 0) {
      return { status: 400, body: { error: 'Validation failed', errors } };
    }

    return handler(req, { body: body.data, query: query.data });
  };
}
