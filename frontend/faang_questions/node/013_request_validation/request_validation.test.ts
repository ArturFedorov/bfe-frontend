import {
  ApiRequest,
  ApiResponse,
  FieldError,
  ValidationSchema,
  withValidation,
} from './request_validation';

function req(body?: unknown, query: Record<string, string> = {}): ApiRequest {
  return { method: 'POST', path: '/reports', headers: {}, query, body };
}

function errorsOf(res: ApiResponse): FieldError[] {
  expect(res.status).toBe(400);
  const body = res.body as { error: string; errors: FieldError[] };
  expect(body.error).toBe('Validation failed');
  return body.errors;
}

const schema: ValidationSchema = {
  body: {
    name: { type: 'string', required: true },
    copies: { type: 'number' },
    dryRun: { type: 'boolean' },
  },
  query: {
    limit: { type: 'number' },
    verbose: { type: 'boolean' },
    format: { type: 'string', required: true },
  },
};

// built lazily so a stubbed withValidation fails per-test, not at import
const handler = (r: ApiRequest) =>
  withValidation(schema, (_req, data) => ({ status: 200, body: data }))(r);

describe('013 request validation', () => {
  describe('happy path', () => {
    it('passes validated body and coerced query to the handler', async () => {
      const res = await handler(
        req(
          { name: 'Q3', copies: 2, dryRun: false },
          {
            limit: '25',
            verbose: 'true',
            format: 'csv',
          },
        ),
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        body: { name: 'Q3', copies: 2, dryRun: false },
        query: { limit: 25, verbose: true, format: 'csv' },
      });
    });

    it('omits absent optional fields from the validated data', async () => {
      const res = await handler(req({ name: 'Q3' }, { format: 'csv' }));

      expect(res.body).toEqual({
        body: { name: 'Q3' },
        query: { format: 'csv' },
      });
    });

    it('coerces negative and decimal numbers', async () => {
      const res = await handler(
        req({ name: 'Q3' }, { format: 'csv', limit: '-2.5' }),
      );

      expect((res.body as { query: { limit: number } }).query.limit).toBe(-2.5);
    });

    it('skips sections missing from the schema entirely', async () => {
      const noBodySchema = withValidation(
        { query: { format: { type: 'string', required: true } } },
        (r, data) => ({ status: 200, body: data }),
      );

      const res = await noBodySchema(
        req({ anything: 'goes', even: 42 }, { format: 'csv' }),
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ body: {}, query: { format: 'csv' } });
    });
  });

  describe('body validation', () => {
    it('reports a missing required field', async () => {
      const res = await handler(req({}, { format: 'csv' }));

      expect(errorsOf(res)).toEqual([
        { path: 'body.name', code: 'required', message: expect.any(String) },
      ]);
    });

    it('does not coerce body values — string numbers are invalid_type', async () => {
      const res = await handler(
        req({ name: 'Q3', copies: '5', dryRun: 1 }, { format: 'csv' }),
      );

      expect(errorsOf(res)).toEqual([
        expect.objectContaining({ path: 'body.copies', code: 'invalid_type' }),
        expect.objectContaining({ path: 'body.dryRun', code: 'invalid_type' }),
      ]);
    });

    it('rejects unknown body fields by name', async () => {
      const res = await handler(
        req({ name: 'Q3', priority: 'high' }, { format: 'csv' }),
      );

      expect(errorsOf(res)).toEqual([
        expect.objectContaining({
          path: 'body.priority',
          code: 'unknown_field',
        }),
      ]);
    });

    it('reports a non-object body as a single body-level error', async () => {
      const res = await handler(req('name=Q3', { format: 'csv' }));

      expect(errorsOf(res)).toEqual([
        expect.objectContaining({ path: 'body', code: 'invalid_type' }),
      ]);
    });

    it('treats a missing body like a non-object when a body schema exists', async () => {
      const res = await handler(req(undefined, { format: 'csv' }));

      expect(errorsOf(res)).toEqual([
        expect.objectContaining({ path: 'body', code: 'invalid_type' }),
      ]);
    });
  });

  describe('query validation', () => {
    it('reports coercion failures with not_coercible', async () => {
      const res = await handler(
        req({ name: 'Q3' }, { format: 'csv', limit: 'lots', verbose: 'yep' }),
      );

      expect(errorsOf(res)).toEqual([
        expect.objectContaining({ path: 'query.limit', code: 'not_coercible' }),
        expect.objectContaining({
          path: 'query.verbose',
          code: 'not_coercible',
        }),
      ]);
    });

    it('accepts only the exact strings true/false for booleans', async () => {
      const ok = await handler(
        req({ name: 'Q3' }, { format: 'csv', verbose: 'false' }),
      );
      const bad = await handler(
        req({ name: 'Q3' }, { format: 'csv', verbose: 'TRUE' }),
      );

      expect(ok.status).toBe(200);
      expect((ok.body as { query: { verbose: boolean } }).query.verbose).toBe(
        false,
      );
      expect(bad.status).toBe(400);
    });

    it('reports a missing required query param', async () => {
      const res = await handler(req({ name: 'Q3' }, {}));

      expect(errorsOf(res)).toEqual([
        expect.objectContaining({ path: 'query.format', code: 'required' }),
      ]);
    });

    it('rejects unknown query params', async () => {
      const res = await handler(
        req({ name: 'Q3' }, { format: 'csv', offset: '10' }),
      );

      expect(errorsOf(res)).toEqual([
        expect.objectContaining({
          path: 'query.offset',
          code: 'unknown_field',
        }),
      ]);
    });
  });

  describe('error aggregation', () => {
    it('collects every error across both sections in documented order', async () => {
      const res = await handler(
        req({ copies: 'many', bogus: 1 }, { limit: 'x', extra: 'y' }),
      );

      expect(errorsOf(res)).toEqual([
        expect.objectContaining({ path: 'body.name', code: 'required' }),
        expect.objectContaining({ path: 'body.copies', code: 'invalid_type' }),
        expect.objectContaining({ path: 'body.bogus', code: 'unknown_field' }),
        expect.objectContaining({ path: 'query.limit', code: 'not_coercible' }),
        expect.objectContaining({ path: 'query.format', code: 'required' }),
        expect.objectContaining({ path: 'query.extra', code: 'unknown_field' }),
      ]);
    });

    it('never invokes the handler when validation fails', async () => {
      let called = 0;
      const spy = withValidation(schema, () => {
        called++;
        return { status: 200 };
      });

      await spy(req({}, {}));

      expect(called).toBe(0);
    });
  });
});
