/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { deferred } from '../_helpers/deferred';
import { ApprovalDecision, ApprovalGate, ApprovalRequest } from './approval_gate';

const T0 = 1_700_000_000_000;

const baseRequest: ApprovalRequest = {
  id: 'req-1',
  action: 'Relabel 340 items',
  current: 'label: car\nconfidence: 0.62\nreviewer: unassigned',
  proposed: 'label: vehicle\nconfidence: 0.62\nreviewer: qa-team',
  expiresAt: T0 + 5_000,
};

function setup(request: ApprovalRequest | null = baseRequest) {
  const pending: Array<ReturnType<typeof deferred<void>>> = [];
  const onDecide = jest.fn((_decision: ApprovalDecision) => {
    const d = deferred<void>();
    pending.push(d);
    return d.promise;
  });
  const utils = render(<ApprovalGate request={request} onDecide={onDecide} />);
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  const rerenderWith = (next: ApprovalRequest | null) => utils.rerender(<ApprovalGate request={next} onDecide={onDecide} />);
  return { ...utils, onDecide, pending, user, rerenderWith };
}

const button = (name: 'Approve' | 'Reject' | 'Edit') => screen.getByRole('button', { name });
const dialog = () => screen.getByRole('dialog', { name: 'Approval required' });

async function settle(d: ReturnType<typeof deferred<void>>, error?: Error) {
  await act(async () => {
    if (error) d.reject(error);
    else d.resolve();
  });
}

function advance(ms: number) {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(T0);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('rendering', () => {
  it('renders nothing when there is no request', () => {
    const { container } = setup(null);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a dialog named Approval required with the action and three buttons', () => {
    setup();
    expect(dialog()).toBeInTheDocument();
    expect(dialog()).toHaveTextContent('Relabel 340 items');
    expect(button('Approve')).toBeEnabled();
    expect(button('Reject')).toBeEnabled();
    expect(button('Edit')).toBeEnabled();
    expect(screen.queryByRole('textbox', { name: 'Proposed action' })).not.toBeInTheDocument();
  });
});

describe('line diff', () => {
  it('marks lines only in current as removed, only in proposed as added, shared lines as same', () => {
    setup();
    const list = screen.getByRole('list', { name: 'Diff' });
    const items = within(list).getAllByRole('listitem');
    const byChange = (change: string) =>
      items.filter((li) => li.getAttribute('data-change') === change).map((li) => li.textContent);

    expect(items).toHaveLength(5);
    expect(byChange('removed')).toEqual(['label: car', 'reviewer: unassigned']);
    expect(byChange('added')).toEqual(['label: vehicle', 'reviewer: qa-team']);
    expect(byChange('same')).toEqual(['confidence: 0.62']);
    items.forEach((li) => expect(['added', 'removed', 'same']).toContain(li.getAttribute('data-change')));
  });

  it('identical current and proposed yields only same lines', () => {
    setup({ ...baseRequest, proposed: baseRequest.current });
    const items = within(screen.getByRole('list', { name: 'Diff' })).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    items.forEach((li) => expect(li).toHaveAttribute('data-change', 'same'));
  });
});

describe('decisions', () => {
  it('Approve sends an approve decision for the request id', async () => {
    const { onDecide, user } = setup();
    await user.click(button('Approve'));
    expect(onDecide).toHaveBeenCalledTimes(1);
    expect(onDecide).toHaveBeenCalledWith({ requestId: 'req-1', kind: 'approve' });
  });

  it('Reject sends a reject decision', async () => {
    const { onDecide, user } = setup();
    await user.click(button('Reject'));
    expect(onDecide).toHaveBeenCalledWith({ requestId: 'req-1', kind: 'reject' });
  });

  it('Edit reveals a labelled textarea prefilled with proposed; Approve then sends approve_edited', async () => {
    const { onDecide, user } = setup();
    await user.click(button('Edit'));

    const textarea = screen.getByRole('textbox', { name: 'Proposed action' });
    expect(textarea).toHaveValue(baseRequest.proposed);

    await user.clear(textarea);
    await user.type(textarea, 'label: vehicle{Enter}reviewer: artur');
    await user.click(button('Approve'));

    expect(onDecide).toHaveBeenCalledTimes(1);
    expect(onDecide).toHaveBeenCalledWith({
      requestId: 'req-1',
      kind: 'approve_edited',
      proposed: 'label: vehicle\nreviewer: artur',
    });
  });

  it('Reject while editing still sends a plain reject', async () => {
    const { onDecide, user } = setup();
    await user.click(button('Edit'));
    await user.type(screen.getByRole('textbox', { name: 'Proposed action' }), ' extra');
    await user.click(button('Reject'));
    expect(onDecide).toHaveBeenCalledWith({ requestId: 'req-1', kind: 'reject' });
  });

  it('Approve is operable with the keyboard', async () => {
    const { onDecide, user } = setup();
    button('Approve').focus();
    await user.keyboard('{Enter}');
    expect(onDecide).toHaveBeenCalledTimes(1);
  });
});

describe('exactly-once submission', () => {
  it('disables every button and marks the dialog busy while the decision is pending', async () => {
    const { user } = setup();
    await user.click(button('Approve'));

    expect(dialog()).toHaveAttribute('aria-busy', 'true');
    expect(button('Approve')).toBeDisabled();
    expect(button('Reject')).toBeDisabled();
    expect(button('Edit')).toBeDisabled();
  });

  it('a double-click and further clicks call onDecide exactly once (senior)', async () => {
    const { onDecide, user, pending } = setup();
    await user.dblClick(button('Approve'));
    fireEvent.click(button('Approve'));
    fireEvent.click(button('Reject'));

    expect(onDecide).toHaveBeenCalledTimes(1);
    expect(pending).toHaveLength(1);
  });

  it('after the promise resolves the status reads Decision sent and nothing more is sent', async () => {
    const { onDecide, user, pending } = setup();
    await user.click(button('Approve'));
    await settle(pending[0]);

    expect(screen.getByRole('status')).toHaveTextContent('Decision sent');
    expect(dialog()).not.toHaveAttribute('aria-busy', 'true');

    const approve = screen.queryByRole('button', { name: 'Approve' });
    if (approve) {
      expect(approve).toBeDisabled();
      fireEvent.click(approve);
    }
    expect(onDecide).toHaveBeenCalledTimes(1);
  });
});

describe('expiry countdown', () => {
  it('shows the remaining seconds and ticks down every second', () => {
    setup();
    expect(screen.getByRole('status')).toHaveTextContent('Expires in 5s');

    advance(1000);
    expect(screen.getByRole('status')).toHaveTextContent('Expires in 4s');

    advance(2000);
    expect(screen.getByRole('status')).toHaveTextContent('Expires in 2s');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('at the deadline disables the buttons and announces Expired', async () => {
    const { onDecide } = setup();
    advance(5000);

    expect(screen.getByRole('alert')).toHaveTextContent('Expired');
    expect(button('Approve')).toBeDisabled();
    expect(button('Reject')).toBeDisabled();
    expect(button('Edit')).toBeDisabled();

    fireEvent.click(button('Approve'));
    expect(onDecide).not.toHaveBeenCalled();
  });

  it('a request that is already expired on mount is expired immediately', () => {
    setup({ ...baseRequest, expiresAt: T0 - 1 });
    expect(screen.getByRole('alert')).toHaveTextContent('Expired');
    expect(button('Approve')).toBeDisabled();
  });

  it('a decision in flight when the deadline passes still completes (senior)', async () => {
    const { user, pending, onDecide } = setup();
    await user.click(button('Approve'));

    advance(6000);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(dialog()).toHaveAttribute('aria-busy', 'true');

    await settle(pending[0]);
    expect(screen.getByRole('status')).toHaveTextContent('Decision sent');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(onDecide).toHaveBeenCalledTimes(1);
  });
});

describe('reconnect recovery', () => {
  it('a replayed request with the same id during a pending decision keeps the pending state (senior)', async () => {
    const { user, pending, onDecide, rerenderWith } = setup();
    await user.click(button('Approve'));

    rerenderWith({ ...baseRequest }); // new object, same id — stream replayed the event

    expect(onDecide).toHaveBeenCalledTimes(1);
    expect(dialog()).toHaveAttribute('aria-busy', 'true');
    expect(button('Approve')).toBeDisabled();

    await settle(pending[0]);
    expect(screen.getByRole('status')).toHaveTextContent('Decision sent');
    expect(onDecide).toHaveBeenCalledTimes(1);
  });

  it('a replayed request with the same id after the decision was sent stays sent', async () => {
    const { user, pending, onDecide, rerenderWith } = setup();
    await user.click(button('Reject'));
    await settle(pending[0]);

    rerenderWith({ ...baseRequest });

    expect(screen.getByRole('status')).toHaveTextContent('Decision sent');
    const reject = screen.queryByRole('button', { name: 'Reject' });
    if (reject) fireEvent.click(reject);
    expect(onDecide).toHaveBeenCalledTimes(1);
  });

  it('a request with a different id resets the gate, and the old promise cannot mark it sent (senior)', async () => {
    const { user, pending, onDecide, rerenderWith } = setup();
    await user.click(button('Edit'));
    await user.click(button('Approve'));
    expect(onDecide).toHaveBeenCalledTimes(1);

    const next: ApprovalRequest = {
      id: 'req-2',
      action: 'Delete 12 duplicate boxes',
      current: 'boxes: 52',
      proposed: 'boxes: 40',
      expiresAt: T0 + 30_000,
    };
    rerenderWith(next);

    expect(dialog()).toHaveTextContent('Delete 12 duplicate boxes');
    expect(dialog()).not.toHaveAttribute('aria-busy', 'true');
    expect(button('Approve')).toBeEnabled();
    expect(screen.queryByRole('textbox', { name: 'Proposed action' })).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Expires in 30s');

    // the old request's decision resolves late
    await settle(pending[0]);
    expect(screen.getByRole('status')).not.toHaveTextContent('Decision sent');
    expect(button('Approve')).toBeEnabled();

    await user.click(button('Approve'));
    expect(onDecide).toHaveBeenCalledTimes(2);
    expect(onDecide).toHaveBeenLastCalledWith({ requestId: 'req-2', kind: 'approve' });
  });

  it('clearing the request removes the dialog', () => {
    const { rerenderWith } = setup();
    rerenderWith(null);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('failure handling', () => {
  it('a rejected onDecide shows the message in an alert and re-enables the buttons for a retry', async () => {
    const { user, pending, onDecide } = setup();
    await user.click(button('Approve'));
    await settle(pending[0], new Error('Gateway timeout'));

    expect(screen.getByRole('alert')).toHaveTextContent('Gateway timeout');
    expect(dialog()).not.toHaveAttribute('aria-busy', 'true');
    expect(button('Approve')).toBeEnabled();
    expect(button('Reject')).toBeEnabled();

    await user.click(button('Approve'));
    expect(onDecide).toHaveBeenCalledTimes(2);
    expect(dialog()).toHaveAttribute('aria-busy', 'true');

    await settle(pending[1]);
    expect(screen.getByRole('status')).toHaveTextContent('Decision sent');
  });

  it('unmounting while a decision is pending causes no errors when it settles', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { user, pending, unmount } = setup();
    await user.click(button('Approve'));

    unmount();
    await settle(pending[0]);
    advance(10_000);

    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
