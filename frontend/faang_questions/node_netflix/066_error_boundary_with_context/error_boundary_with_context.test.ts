import {
  AppError,
  ValidationError,
  NotFoundError,
} from './error_boundary_with_context';

describe('AppError hierarchy', () => {
  it('carries code and context and serializes', () => {
    const err = new ValidationError('bad input', { field: 'email' });
    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe('VALIDATION');
    expect(err.toJSON()).toEqual({
      name: 'ValidationError',
      code: 'VALIDATION',
      message: 'bad input',
      context: { field: 'email' },
    });
  });

  it('NotFoundError has its own code', () => {
    expect(new NotFoundError('missing').code).toBe('NOT_FOUND');
  });

  it('sets name to the concrete subclass', () => {
    expect(new ValidationError('x').name).toBe('ValidationError');
    expect(new NotFoundError('y').name).toBe('NotFoundError');
  });

  it('exposes the message via Error.message', () => {
    expect(new ValidationError('bad input').message).toBe('bad input');
  });

  it('works with instanceof across the hierarchy', () => {
    const err = new NotFoundError('missing');
    expect(err).toBeInstanceOf(NotFoundError);
    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
  });

  it('distinguishes sibling subclasses', () => {
    const err = new ValidationError('x');
    expect(err).toBeInstanceOf(ValidationError);
    expect(err).not.toBeInstanceOf(NotFoundError);
  });

  it('can be caught as AppError when thrown', () => {
    expect(() => {
      throw new ValidationError('bad input');
    }).toThrow(AppError);
  });

  it('serializes without context when none is provided', () => {
    expect(new NotFoundError('missing').toJSON()).toEqual({
      name: 'NotFoundError',
      code: 'NOT_FOUND',
      message: 'missing',
    });
  });

  it('preserves arbitrary context keys in toJSON', () => {
    const err = new NotFoundError('missing', { id: 42, resource: 'user' });
    expect(err.toJSON().context).toEqual({ id: 42, resource: 'user' });
  });

  it('reports the subclass name in toJSON for NotFoundError', () => {
    expect(new NotFoundError('missing', { id: 1 }).toJSON()).toEqual({
      name: 'NotFoundError',
      code: 'NOT_FOUND',
      message: 'missing',
      context: { id: 1 },
    });
  });
});
