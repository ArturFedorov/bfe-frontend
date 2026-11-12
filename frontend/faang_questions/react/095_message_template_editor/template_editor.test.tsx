/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  renderTemplate,
  TemplateBlock,
  TemplateEditor,
  TemplateEditorProps,
  tokenizeTemplate,
} from './template_editor';

const blocks: TemplateBlock[] = [
  { id: 'hero-1', label: 'Hero banner', text: 'Big summer sale' },
  { id: 'footer', label: 'Legal footer', text: 'Reply STOP to opt out' },
];

const variables = { first_name: 'Ada', city: 'Zurich' };

function setup(overrides: Partial<TemplateEditorProps> = {}) {
  const onChange = jest.fn();
  const props: TemplateEditorProps = {
    value: 'Hi {{first_name}}',
    onChange,
    variables,
    blocks,
    channel: 'email',
    ...overrides,
  };
  const utils = render(<TemplateEditor {...props} />);
  const rerender = (next: Partial<TemplateEditorProps>) =>
    utils.rerender(<TemplateEditor {...props} {...next} />);
  return { ...utils, rerender, onChange };
}

const textarea = () => screen.getByLabelText('Template') as HTMLTextAreaElement;
const preview = () => screen.getByRole('region', { name: 'Preview' });
const problems = () =>
  within(screen.getByRole('alert'))
    .getAllByRole('listitem')
    .map((li) => li.textContent);

describe('095 template editor — tokenizeTemplate', () => {
  it('returns text, placeholder and placeholder-with-fallback tokens with raw slices', () => {
    expect(tokenizeTemplate('Hi {{first_name | there}}, see {{city}}!')).toEqual([
      { type: 'text', value: 'Hi ' },
      { type: 'placeholder', name: 'first_name', fallback: 'there', raw: '{{first_name | there}}' },
      { type: 'text', value: ', see ' },
      { type: 'placeholder', name: 'city', raw: '{{city}}' },
      { type: 'text', value: '!' },
    ]);
  });

  it('parses {{block:<id>}} into a block token with a trimmed id', () => {
    expect(tokenizeTemplate('{{ block: hero-1 }}')).toEqual([
      { type: 'block', id: 'hero-1', raw: '{{ block: hero-1 }}' },
    ]);
  });

  it('an unclosed {{ produces a single error token with the index and consumes the rest', () => {
    expect(tokenizeTemplate('Hello {{name and more')).toEqual([
      { type: 'text', value: 'Hello ' },
      { type: 'error', message: 'Unclosed placeholder at 6', index: 6 },
    ]);
  });

  it('an empty name is an error token and tokenizing continues afterwards', () => {
    expect(tokenizeTemplate('a{{ }}b')).toEqual([
      { type: 'text', value: 'a' },
      { type: 'error', message: 'Empty placeholder at 1', index: 1 },
      { type: 'text', value: 'b' },
    ]);
  });

  it('the empty string tokenizes to no tokens', () => {
    expect(tokenizeTemplate('')).toEqual([]);
  });

  it('senior: \\{{ is a literal {{ and merges with surrounding text into one token', () => {
    expect(tokenizeTemplate('a \\{{ b')).toEqual([{ type: 'text', value: 'a {{ b' }]);
    expect(tokenizeTemplate('\\{{first_name}} {{city}}')).toEqual([
      { type: 'text', value: '{{first_name}} ' },
      { type: 'placeholder', name: 'city', raw: '{{city}}' },
    ]);
  });
});

describe('095 template editor — renderTemplate', () => {
  const blockMap = { 'hero-1': 'Big summer sale' };

  it('substitutes variables and falls back when a variable is missing', () => {
    expect(renderTemplate('Hi {{first_name}} from {{city | your city}}', { first_name: 'Ada' }, {})).toEqual(
      { text: 'Hi Ada from your city', unknown: [] },
    );
  });

  it('keeps unknown placeholders raw and lists each name once', () => {
    expect(renderTemplate('{{x}} {{y}} {{x}}', {}, {})).toEqual({
      text: '{{x}} {{y}} {{x}}',
      unknown: ['x', 'y'],
    });
  });

  it('renders known blocks and lists unknown blocks as block:<id>', () => {
    expect(renderTemplate('{{block:hero-1}} / {{block:nope}}', {}, blockMap)).toEqual({
      text: 'Big summer sale / {{block:nope}}',
      unknown: ['block:nope'],
    });
  });

  it('renders the remainder after an unclosed {{ literally', () => {
    expect(renderTemplate('Hi {{first_name}} {{oops', { first_name: 'Ada' }, {}).text).toBe('Hi Ada {{oops');
  });
});

describe('095 template editor — controlled textarea and preview', () => {
  it('shows value in the textarea labelled Template and the rendered text in the Preview region', () => {
    setup({ value: 'Hi {{first_name}}, {{block:hero-1}}' });
    expect(textarea()).toHaveValue('Hi {{first_name}}, {{block:hero-1}}');
    expect(preview()).toHaveTextContent('Hi Ada, Big summer sale');
  });

  it('typing calls onChange with the next value and does not change the textarea on its own', async () => {
    const user = userEvent.setup();
    const { onChange } = setup({ value: 'Hi' });
    await user.type(textarea(), '!');
    expect(onChange).toHaveBeenCalledWith('Hi!');
    expect(textarea()).toHaveValue('Hi');
  });

  it('re-rendering with a new value updates the preview', () => {
    const { rerender } = setup({ value: 'Hi {{first_name}}' });
    rerender({ value: 'Bye {{city}}' });
    expect(preview()).toHaveTextContent('Bye Zurich');
  });
});

describe('095 template editor — problems alert', () => {
  it('renders no alert for a clean template', () => {
    setup({ value: 'Hi {{first_name | there}} {{block:footer}}' });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('lists unknown placeholders, unknown blocks and unclosed placeholders', () => {
    setup({ value: '{{nick}} {{block:nope}} {{tail' });
    expect(problems()).toEqual([
      'Unknown placeholder: {{nick}}',
      'Unknown block: {{block:nope}}',
      'Unclosed placeholder at 24',
    ]);
  });

  it('senior: escaped braces are not reported and render literally', () => {
    setup({ value: 'Use \\{{first_name}} literally' });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(preview()).toHaveTextContent('Use {{first_name}} literally');
  });
});

describe('095 template editor — Insert block', () => {
  it('lists one option per block by label plus a blank option', () => {
    setup();
    const select = screen.getByLabelText('Insert block') as HTMLSelectElement;
    const labels = within(select)
      .getAllByRole('option')
      .map((o) => o.textContent?.trim());
    expect(labels.slice(1)).toEqual(['Hero banner', 'Legal footer']);
    expect(labels[0]).toBe('');
  });

  it('inserts {{block:<id>}} at the end when the caret is at the end and resets the select', async () => {
    const user = userEvent.setup();
    const { onChange } = setup({ value: 'Hello ' });
    textarea().setSelectionRange(6, 6);
    const select = screen.getByLabelText('Insert block') as HTMLSelectElement;
    await user.selectOptions(select, 'footer');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('Hello {{block:footer}}');
    expect(select).toHaveValue('');
  });

  it('senior: inserts at a caret in the middle of the text', async () => {
    const user = userEvent.setup();
    const { onChange } = setup({ value: 'Hello world' });
    textarea().setSelectionRange(6, 6);
    await user.selectOptions(screen.getByLabelText('Insert block'), 'hero-1');
    expect(onChange).toHaveBeenCalledWith('Hello {{block:hero-1}}world');
  });

  it('senior: replaces the selected range instead of inserting before it', async () => {
    const user = userEvent.setup();
    const { onChange } = setup({ value: 'Hello world' });
    textarea().setSelectionRange(0, 5);
    await user.selectOptions(screen.getByLabelText('Insert block'), 'hero-1');
    expect(onChange).toHaveBeenCalledWith('{{block:hero-1}} world');
  });
});

describe('095 template editor — character counter', () => {
  it('email shows "N characters" for the rendered text and no aria-invalid', () => {
    setup({ value: 'Hi {{first_name}}', channel: 'email' });
    expect(screen.getByRole('status')).toHaveTextContent('6 characters');
    expect(textarea()).not.toHaveAttribute('aria-invalid');
  });

  it('sms shows "N / 160" while within the limit', () => {
    setup({ value: 'Hi {{first_name}}', channel: 'sms' });
    expect(screen.getByRole('status')).toHaveTextContent('6 / 160');
    expect(textarea()).not.toHaveAttribute('aria-invalid', 'true');
  });

  it('sms over the limit reports "over by K" and marks the textarea invalid', () => {
    const long = 'x'.repeat(150) + ' {{first_name}} {{block:hero-1}}'; // 150 + 1 + 3 + 1 + 15 = 170
    setup({ value: long, channel: 'sms' });
    expect(screen.getByRole('status')).toHaveTextContent('170 / 160 — over by 10');
    expect(textarea()).toHaveAttribute('aria-invalid', 'true');
  });
});
