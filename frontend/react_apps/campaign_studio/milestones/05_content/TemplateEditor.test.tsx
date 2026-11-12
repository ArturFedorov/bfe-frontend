/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createApi } from '../../shell/api';
import { templates } from '../../shell/fixtures';
import { TemplateEditor } from './TemplateEditor';

function setup(
  props: Partial<React.ComponentProps<typeof TemplateEditor>> = {},
) {
  const api = createApi({ latencyMs: 0 });
  const onSaved = jest.fn();
  render(<TemplateEditor api={api} onSaved={onSaved} {...props} />);
  return { api, onSaved };
}

describe('05 TemplateEditor', () => {
  it('loads the requested (or first) template into the body textarea and previews it with sample vars and real blocks', async () => {
    const { api } = setup({ templateId: 't1' });
    const body = await screen.findByRole('textbox', { name: 'Template body' });
    expect(body).toHaveValue(templates.find((t) => t.id === 't1')!.body);
    expect(api.calls.listTemplates).toBe(1);
    expect(api.calls.listBlocks).toBe(1);

    const preview = screen.getByLabelText('Preview');
    expect(preview).toHaveTextContent('=== Campaign Studio ===');
    expect(preview).toHaveTextContent('Hi Ava,');
    expect(preview).toHaveTextContent('Thanks for joining on the pro plan.');
    expect(preview).toHaveTextContent('Reply STOP to unsubscribe.');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    // without templateId the first template opens; sampleVars override the preview
    cleanup();
    setup({ sampleVars: { first_name: 'Noor', plan: 'enterprise' } });
    expect(
      await screen.findByRole('textbox', { name: 'Template body' }),
    ).toHaveValue(templates[0].body);
    expect(screen.getByLabelText('Preview')).toHaveTextContent('Hi Noor,');
    expect(screen.getByLabelText('Preview')).toHaveTextContent(
      'enterprise plan',
    );
  });

  it('shows problems in an alert while the body is broken and clears it once fixed; preview follows the edit', async () => {
    setup({ templateId: 't1' });
    const body = await screen.findByRole('textbox', { name: 'Template body' });

    fireEvent.change(body, { target: { value: 'Hi {{first_name' } });
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/unclosed/i);
    expect(screen.getByLabelText('Preview')).toHaveTextContent(
      'Hi {{first_name',
    );

    fireEvent.change(body, {
      target: { value: 'Hi {{first_name}} {{block:nope}} {{missing_var}}' },
    });
    const items = within(screen.getByRole('alert')).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent(/nope/);
    expect(items[1]).toHaveTextContent(/missing_var/);

    fireEvent.change(body, { target: { value: 'Hi {{first_name}}!' } });
    await waitFor(() =>
      expect(screen.queryByRole('alert')).not.toBeInTheDocument(),
    );
    expect(screen.getByLabelText('Preview')).toHaveTextContent('Hi Ava!');
  });

  it('the Insert block select appends {{block:id}} to the body and resets itself', async () => {
    const user = userEvent.setup();
    setup({ templateId: 't4' });
    const body = await screen.findByRole('textbox', { name: 'Template body' });
    const before = templates.find((t) => t.id === 't4')!.body;

    const insert = screen.getByRole('combobox', { name: 'Insert block' });
    expect(
      within(insert).getByRole('option', { name: 'Footer' }),
    ).toBeInTheDocument();
    await user.selectOptions(insert, 'footer');

    expect(body).toHaveValue(`${before}{{block:footer}}`);
    expect(insert).toHaveValue('');
    expect(screen.getByLabelText('Preview')).toHaveTextContent(
      'Sent by Campaign Studio.',
    );
  });

  it('shows an SMS counter for sms templates only, and it tracks the rendered length', async () => {
    const { api } = setup({ templateId: 't2' });
    const body = await screen.findByRole('textbox', { name: 'Template body' });
    const counter = screen.getByRole('status');
    expect(counter).toHaveTextContent(/^\d+ chars · 1 segment · GSM-7$/);

    fireEvent.change(body, { target: { value: 'x'.repeat(161) } });
    expect(screen.getByRole('status')).toHaveTextContent(
      '161 chars · 2 segments · GSM-7',
    );
    fireEvent.change(body, { target: { value: 'hi 😀' } });
    expect(screen.getByRole('status')).toHaveTextContent(
      '5 chars · 1 segment · UCS-2',
    );
    expect(api.calls.listTemplates).toBe(1);
  });

  it('email templates have no SMS counter; Save persists the edited body and calls onSaved', async () => {
    const user = userEvent.setup();
    const { api, onSaved } = setup({ templateId: 't5' });
    const body = await screen.findByRole('textbox', { name: 'Template body' });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    fireEvent.change(body, {
      target: { value: 'Dear {{first_name | customer}}, bye.' },
    });
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(api.calls.saveTemplate).toBe(1);
    expect(onSaved.mock.calls[0][0]).toMatchObject({
      id: 't5',
      channel: 'email',
      body: 'Dear {{first_name | customer}}, bye.',
    });

    const saved = api.listTemplates();
    expect((await saved).find((t) => t.id === 't5')!.body).toBe(
      'Dear {{first_name | customer}}, bye.',
    );
  });
});
