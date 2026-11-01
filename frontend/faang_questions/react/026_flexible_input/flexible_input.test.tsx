/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FlexibleInput } from './flexible_input';

describe('026 FlexibleInput controlled/uncontrolled modes', () => {
  it('associates the input with its label', () => {
    render(<FlexibleInput label="Partner ID" defaultValue="pk-104" />);
    expect(screen.getByLabelText('Partner ID')).toHaveValue('pk-104');
  });

  describe('controlled mode', () => {
    it('always displays the value prop and reports typing via onChange', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<FlexibleInput label="Partner ID" value="pk-1" onChange={onChange} />);
      const input = screen.getByLabelText('Partner ID');

      await user.type(input, '9');
      expect(onChange).toHaveBeenCalledWith('pk-19');
      // parent never updated the prop, so the display must not change
      expect(input).toHaveValue('pk-1');
    });

    it('follows the value when the parent updates it', async () => {
      const user = userEvent.setup();
      function Harness() {
        const [value, setValue] = useState('');
        return <FlexibleInput label="Partner ID" value={value} onChange={setValue} />;
      }
      render(<Harness />);
      const input = screen.getByLabelText('Partner ID');

      await user.type(input, 'pk-42');
      expect(input).toHaveValue('pk-42');
    });
  });

  describe('uncontrolled mode', () => {
    it('initializes from defaultValue and manages its own state', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(
        <FlexibleInput label="Partner ID" defaultValue="pk-" onChange={onChange} />,
      );
      const input = screen.getByLabelText('Partner ID');

      await user.type(input, '77');
      expect(input).toHaveValue('pk-77');
      expect(onChange).toHaveBeenLastCalledWith('pk-77');
    });

    it('defaults to an empty string when defaultValue is omitted', () => {
      render(<FlexibleInput label="Partner ID" />);
      expect(screen.getByLabelText('Partner ID')).toHaveValue('');
    });

    it('does not follow a later defaultValue change', () => {
      const { rerender } = render(
        <FlexibleInput label="Partner ID" defaultValue="pk-1" />,
      );
      rerender(<FlexibleInput label="Partner ID" defaultValue="pk-2" />);
      expect(screen.getByLabelText('Partner ID')).toHaveValue('pk-1');
    });
  });

  describe('mode-switch warning', () => {
    let warnSpy: jest.SpyInstance;

    beforeEach(() => {
      warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    it('warns when switching from uncontrolled to controlled', () => {
      const { rerender } = render(<FlexibleInput label="Partner ID" />);
      rerender(<FlexibleInput label="Partner ID" value="pk-1" />);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringMatching(/uncontrolled to controlled/),
      );
    });

    it('warns when switching from controlled to uncontrolled', () => {
      const { rerender } = render(<FlexibleInput label="Partner ID" value="pk-1" />);
      rerender(<FlexibleInput label="Partner ID" />);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringMatching(/controlled to uncontrolled/),
      );
    });

    it('warns at most once per instance and not for stable modes', () => {
      const { rerender } = render(<FlexibleInput label="Partner ID" />);
      rerender(<FlexibleInput label="Partner ID" />);
      expect(warnSpy).not.toHaveBeenCalled();

      rerender(<FlexibleInput label="Partner ID" value="pk-1" />);
      rerender(<FlexibleInput label="Partner ID" value="pk-2" />);
      rerender(<FlexibleInput label="Partner ID" />);
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });
  });
});
