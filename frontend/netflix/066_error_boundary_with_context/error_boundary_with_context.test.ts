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
});
