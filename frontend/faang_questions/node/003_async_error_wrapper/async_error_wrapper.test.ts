import {
  isOperationalError,
  NotFoundError,
  OperationalError,
  ValidationError,
  withErrorHandling,
} from './async_error_wrapper';

describe('OperationalError hierarchy', () => {
  it('carries message, code, and statusCode (default 500)', () => {
    const err = new OperationalError('upstream unavailable', 'UPSTREAM_DOWN');
    expect(err.message).toBe('upstream unavailable');
    expect(err.code).toBe('UPSTREAM_DOWN');
    expect(err.statusCode).toBe(500);
  });

  it('subclasses survive instanceof checks (prototype chain intact)', () => {
    const notFound = new NotFoundError('partner p-1 not found');
    expect(notFound).toBeInstanceOf(NotFoundError);
    expect(notFound).toBeInstanceOf(OperationalError);
    expect(notFound).toBeInstanceOf(Error);
    expect(notFound.code).toBe('NOT_FOUND');
    expect(notFound.statusCode).toBe(404);

    const invalid = new ValidationError('taxId is required');
    expect(invalid).toBeInstanceOf(ValidationError);
    expect(invalid.code).toBe('VALIDATION');
    expect(invalid.statusCode).toBe(400);
  });
});

describe('isOperationalError', () => {
  it('accepts OperationalError and subclasses', () => {
    expect(isOperationalError(new OperationalError('x', 'X'))).toBe(true);
    expect(isOperationalError(new NotFoundError('x'))).toBe(true);
  });

  it('rejects everything else, including duck-typed objects', () => {
    expect(isOperationalError(new TypeError('bug'))).toBe(false);
    expect(isOperationalError(new Error('plain'))).toBe(false);
    expect(isOperationalError(null)).toBe(false);
    expect(isOperationalError(undefined)).toBe(false);
    expect(isOperationalError('NOT_FOUND')).toBe(false);
    expect(
      isOperationalError({
        code: 'NOT_FOUND',
        statusCode: 404,
        message: 'fake',
      }),
    ).toBe(false);
  });
});

describe('withErrorHandling', () => {
  it('passes arguments through and returns { ok: true, value } on success', async () => {
    const handler = withErrorHandling(
      async (a: number, b: string) => `${b}:${a}`,
    );
    await expect(handler(42, 'partner')).resolves.toEqual({
      ok: true,
      value: 'partner:42',
    });
  });

  it('formats operational errors instead of rejecting', async () => {
    const handler = withErrorHandling(async (id: string) => {
      throw new NotFoundError(`partner ${id} not found`);
    });
    await expect(handler('p-9')).resolves.toEqual({
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: 'partner p-9 not found',
        statusCode: 404,
      },
    });
  });

  it('does not leak the raw error object in the formatted result', async () => {
    const handler = withErrorHandling(async () => {
      throw new ValidationError('bad');
    });
    const result = await handler();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).not.toBeInstanceOf(Error);
      expect(Object.keys(result.error).sort()).toEqual([
        'code',
        'message',
        'statusCode',
      ]);
    }
  });

  it('rethrows programmer errors by reference — no wrapping', async () => {
    const bug = new TypeError('cannot read properties of undefined');
    const handler = withErrorHandling(async () => {
      throw bug;
    });
    await expect(handler()).rejects.toBe(bug);
  });

  it('rethrows plain Errors and thrown non-Errors too', async () => {
    const plain = new Error('unclassified');
    await expect(
      withErrorHandling(async () => {
        throw plain;
      })(),
    ).rejects.toBe(plain);

    await expect(
      withErrorHandling(async () => {
        throw 'string throw'; // eslint-disable-line no-throw-literal
      })(),
    ).rejects.toBe('string throw');
  });

  it('treats a synchronous throw the same as a rejection', async () => {
    const handler = withErrorHandling((): Promise<never> => {
      throw new NotFoundError('sync miss');
    });
    await expect(handler()).resolves.toEqual({
      ok: false,
      error: { code: 'NOT_FOUND', message: 'sync miss', statusCode: 404 },
    });

    const bug = new RangeError('sync bug');
    const buggy = withErrorHandling((): Promise<never> => {
      throw bug;
    });
    await expect(buggy()).rejects.toBe(bug);
  });
});
