/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary, ErrorBoundaryFallbackProps } from './error_boundary';

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Malformed partner record');
  }
  return <p>Widget content</p>;
}

const fallback = ({ error, reset }: ErrorBoundaryFallbackProps) => (
  <div role="alert">
    <p>Widget failed: {error.message}</p>
    <button onClick={reset}>Try again</button>
  </div>
);

describe('031 ErrorBoundary', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    // silence React's error-boundary logging and jsdom's uncaught-error reports
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('renders children when nothing throws', () => {
    render(
      <ErrorBoundary fallback={fallback}>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Widget content')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('catches a render error and passes it to the fallback render prop', () => {
    render(
      <ErrorBoundary fallback={fallback}>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Widget failed: Malformed partner record',
    );
    expect(screen.queryByText('Widget content')).not.toBeInTheDocument();
  });

  it('reports the error through onError with component stack info', () => {
    const onError = jest.fn();
    render(
      <ErrorBoundary fallback={fallback} onError={onError}>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );
    expect(onError).toHaveBeenCalledTimes(1);
    const [error, errorInfo] = onError.mock.calls[0];
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Malformed partner record');
    expect(errorInfo).toHaveProperty('componentStack');
  });

  it('recovers when the fallback calls reset after the cause is fixed', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [shouldThrow, setShouldThrow] = useState(true);
      return (
        <ErrorBoundary
          fallback={({ error, reset }) => (
            <div role="alert">
              <p>{error.message}</p>
              <button
                onClick={() => {
                  setShouldThrow(false);
                  reset();
                }}
              >
                Try again
              </button>
            </div>
          )}
        >
          <Bomb shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );
    }
    render(<Harness />);
    expect(screen.getByRole('alert')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByText('Widget content')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('remounts children when resetKey changes while in the error state', () => {
    const { rerender } = render(
      <ErrorBoundary resetKey="partner-1" fallback={fallback}>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // same key: stays in the error state even though children would now be fine
    rerender(
      <ErrorBoundary resetKey="partner-1" fallback={fallback}>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // new key: boundary resets and mounts the children fresh
    rerender(
      <ErrorBoundary resetKey="partner-2" fallback={fallback}>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Widget content')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does not catch errors thrown outside render, e.g. in event handlers', () => {
    function HandlerBomb() {
      return (
        <button
          onClick={() => {
            throw new Error('handler exploded');
          }}
        >
          Detonate
        </button>
      );
    }
    // the error escapes to window as a plain uncaught error instead of
    // reaching the boundary; swallow the report so jest does not fail on it
    const onWindowError = jest.fn((event: ErrorEvent) =>
      event.preventDefault(),
    );
    window.addEventListener('error', onWindowError);
    try {
      render(
        <ErrorBoundary fallback={fallback}>
          <HandlerBomb />
        </ErrorBoundary>,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Detonate' }));

      expect(onWindowError).toHaveBeenCalled();
      // the boundary must not swallow it into the fallback
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Detonate' }),
      ).toBeInTheDocument();
    } finally {
      window.removeEventListener('error', onWindowError);
    }
  });
});
