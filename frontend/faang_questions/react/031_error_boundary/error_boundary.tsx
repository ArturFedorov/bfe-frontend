import { Component, ErrorInfo, ReactNode } from 'react';

export type ErrorBoundaryFallbackProps = {
  error: Error;
  reset: () => void;
};

export type ErrorBoundaryProps = {
  children: ReactNode;
  fallback: (props: ErrorBoundaryFallbackProps) => ReactNode;
  resetKey?: unknown;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
};

export type ErrorBoundaryState = {
  error: Error | null;
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // TODO: implement
    throw new Error('Not implemented');
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // TODO: implement
    throw new Error('Not implemented');
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // TODO: implement
    throw new Error('Not implemented');
  }

  reset = (): void => {
    // TODO: implement
    throw new Error('Not implemented');
  };

  render(): ReactNode {
    // TODO: implement
    throw new Error('Not implemented');
  }
}
