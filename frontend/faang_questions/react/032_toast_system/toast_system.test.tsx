/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { useRef } from 'react';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ShowToastOptions,
  ToastProvider,
  ToastViewport,
  useToast,
} from './toast_system';

function ShowButton({
  message,
  options,
}: {
  message: string;
  options?: ShowToastOptions;
}) {
  const { show } = useToast();
  return <button onClick={() => show(message, options)}>Show {message}</button>;
}

function ShowThreeButton() {
  const { show } = useToast();
  return (
    <button
      onClick={() => {
        show('Toast A');
        show('Toast B');
        show('Toast C');
      }}
    >
      Show three
    </button>
  );
}

function ShowAndDismiss() {
  const { show, dismiss } = useToast();
  const idRef = useRef<string | null>(null);
  return (
    <>
      <button onClick={() => (idRef.current = show('Persistent'))}>
        Show persistent
      </button>
      <button onClick={() => idRef.current !== null && dismiss(idRef.current)}>
        Dismiss persistent
      </button>
    </>
  );
}

describe('032 toast system', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function setupUser() {
    return userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  }

  it('renders queued toasts in a polite live region portaled outside the root container', async () => {
    const user = setupUser();
    const { container } = render(
      <ToastProvider>
        <ShowButton message="Sync complete" />
        <ToastViewport />
      </ToastProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Show Sync complete' }));
    const region = screen.getByRole('status', { name: 'Notifications' });
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(within(region).getByText('Sync complete')).toBeInTheDocument();
    // portal: the live region lives in document.body, not in the React root
    expect(container.querySelector('[role="status"]')).toBeNull();
  });

  it('auto-dismisses a toast after the default 5000ms duration', async () => {
    const user = setupUser();
    render(
      <ToastProvider>
        <ShowButton message="Sync complete" />
        <ToastViewport />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Show Sync complete' }));

    act(() => jest.advanceTimersByTime(4999));
    expect(screen.getByText('Sync complete')).toBeInTheDocument();

    act(() => jest.advanceTimersByTime(1));
    expect(screen.queryByText('Sync complete')).not.toBeInTheDocument();
  });

  it('honors a per-toast duration override', async () => {
    const user = setupUser();
    render(
      <ToastProvider duration={5000}>
        <ShowButton message="Quick note" options={{ duration: 1000 }} />
        <ToastViewport />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Show Quick note' }));

    act(() => jest.advanceTimersByTime(1000));
    expect(screen.queryByText('Quick note')).not.toBeInTheDocument();
  });

  it('caps visible toasts at maxVisible and promotes queued toasts with a fresh timer', async () => {
    const user = setupUser();
    render(
      <ToastProvider maxVisible={2} duration={1000}>
        <ShowThreeButton />
        <ToastViewport />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Show three' }));

    expect(screen.getByText('Toast A')).toBeInTheDocument();
    expect(screen.getByText('Toast B')).toBeInTheDocument();
    expect(screen.queryByText('Toast C')).not.toBeInTheDocument();

    // C stays queued (and unburned) until A and B expire
    act(() => jest.advanceTimersByTime(999));
    expect(screen.queryByText('Toast C')).not.toBeInTheDocument();
    act(() => jest.advanceTimersByTime(1));
    expect(screen.queryByText('Toast A')).not.toBeInTheDocument();
    expect(screen.queryByText('Toast B')).not.toBeInTheDocument();
    expect(screen.getByText('Toast C')).toBeInTheDocument();

    // fresh full duration for the promoted toast
    act(() => jest.advanceTimersByTime(999));
    expect(screen.getByText('Toast C')).toBeInTheDocument();
    act(() => jest.advanceTimersByTime(1));
    expect(screen.queryByText('Toast C')).not.toBeInTheDocument();
  });

  it('pauses the timer on hover and resumes with the remaining time', async () => {
    const user = setupUser();
    render(
      <ToastProvider duration={1000}>
        <ShowButton message="Sync complete" />
        <ToastViewport />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Show Sync complete' }));

    act(() => jest.advanceTimersByTime(400));
    const toastText = screen.getByText('Sync complete');
    await user.hover(toastText);

    // paused: far past the original deadline, still visible
    act(() => jest.advanceTimersByTime(5000));
    expect(screen.getByText('Sync complete')).toBeInTheDocument();

    await user.unhover(toastText);
    // resumes with the remaining 600ms, not a full restart
    act(() => jest.advanceTimersByTime(599));
    expect(screen.getByText('Sync complete')).toBeInTheDocument();
    act(() => jest.advanceTimersByTime(1));
    expect(screen.queryByText('Sync complete')).not.toBeInTheDocument();
  });

  it('dismisses immediately via the toast close button', async () => {
    const user = setupUser();
    render(
      <ToastProvider>
        <ShowButton message="Sync complete" />
        <ToastViewport />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Show Sync complete' }));
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByText('Sync complete')).not.toBeInTheDocument();
  });

  it('show returns an id that dismiss(id) removes', async () => {
    const user = setupUser();
    render(
      <ToastProvider>
        <ShowAndDismiss />
        <ToastViewport />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Show persistent' }));
    expect(screen.getByText('Persistent')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Dismiss persistent' }));
    expect(screen.queryByText('Persistent')).not.toBeInTheDocument();
  });

  it('cleans up pending timers on unmount', async () => {
    const user = setupUser();
    const { unmount } = render(
      <ToastProvider>
        <ShowButton message="Sync complete" />
        <ToastViewport />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Show Sync complete' }));
    expect(jest.getTimerCount()).toBeGreaterThan(0);

    unmount();
    expect(jest.getTimerCount()).toBe(0);
    expect(() => jest.advanceTimersByTime(10000)).not.toThrow();
  });

  it('throws a helpful error when useToast is used outside the provider', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    function Orphan() {
      useToast();
      return null;
    }
    expect(() => render(<Orphan />)).toThrow(
      /useToast must be used within <ToastProvider>/,
    );
    errorSpy.mockRestore();
  });
});
