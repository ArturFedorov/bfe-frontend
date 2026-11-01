/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

function Smoke() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount((c) => c + 1)}>clicked {count}</button>
  );
}

describe('react toolchain smoke test', () => {
  it('renders and responds to user events', async () => {
    const user = userEvent.setup();
    render(<Smoke />);
    const button = screen.getByRole('button', { name: /clicked 0/ });
    expect(button).toBeInTheDocument();
    await user.click(button);
    expect(screen.getByRole('button', { name: /clicked 1/ })).toBeVisible();
  });
});
