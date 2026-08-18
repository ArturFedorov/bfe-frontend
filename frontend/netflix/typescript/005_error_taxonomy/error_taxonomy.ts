export type AppError =
  | { kind: 'network'; status: number; url: string }
  | { kind: 'validation'; field: string; message: string }
  | { kind: 'auth'; reason: 'expired' | 'missing' }
  | { kind: 'unknown'; cause: unknown };

export type ErrorKind = any; // TODO: the discriminant union, derived from AppError

export type ErrorByKind<K extends ErrorKind> = any; // TODO: one variant, via Extract

export type ErrorHandlerMap = any; // TODO: mapped type — one handler per kind

// TODO: implement one handler per kind (keep `satisfies`, no type annotation)
export const errorHandlers = {} satisfies ErrorHandlerMap;

export function describeError(error: AppError): string {
  // TODO: implement — dispatch through errorHandlers
  throw new Error('Not implemented');
}
