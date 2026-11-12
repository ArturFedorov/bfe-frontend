import { blocks as fixtureBlocks, templates } from '../../shell/fixtures';
import { placeholders, render, smsInfo, tokenize } from './template';

const blocks: Record<string, string> = Object.fromEntries(
  fixtureBlocks.map((b) => [b.id, b.content]),
);

describe('05 template — tokenize', () => {
  it('splits text, placeholders (with and without fallback) and blocks; whitespace inside braces is ignored', () => {
    expect(
      tokenize(
        'Hi {{first_name}}, you are on {{ plan | free }}.\n{{block: footer }}',
      ),
    ).toEqual([
      { type: 'text', value: 'Hi ' },
      { type: 'placeholder', name: 'first_name', raw: '{{first_name}}' },
      { type: 'text', value: ', you are on ' },
      {
        type: 'placeholder',
        name: 'plan',
        fallback: 'free',
        raw: '{{ plan | free }}',
      },
      { type: 'text', value: '.\n' },
      { type: 'block', id: 'footer', raw: '{{block: footer }}' },
    ]);
    expect(tokenize('')).toEqual([]);
    expect(tokenize('plain')).toEqual([{ type: 'text', value: 'plain' }]);
  });

  it('\\{{ escapes to literal braces and merges with surrounding text', () => {
    expect(tokenize('Use \\{{ literal }} here')).toEqual([
      { type: 'text', value: 'Use {{ literal }} here' },
    ]);
    expect(tokenize('\\{{a}} {{b}}')).toEqual([
      { type: 'text', value: '{{a}} ' },
      { type: 'placeholder', name: 'b', raw: '{{b}}' },
    ]);
  });

  it('reports error tokens for unclosed tags, empty names and bad identifiers, and keeps parsing after them', () => {
    expect(
      tokenize(
        'Hello {{first_name, never closes and {{block:missing}} points nowhere.',
      ),
    ).toEqual([
      { type: 'text', value: 'Hello ' },
      {
        type: 'error',
        message: expect.stringMatching(/unclosed/i),
        raw: '{{first_name, never closes and ',
      },
      { type: 'block', id: 'missing', raw: '{{block:missing}}' },
      { type: 'text', value: ' points nowhere.' },
    ]);
    expect(tokenize('x {{}} y')).toEqual([
      { type: 'text', value: 'x ' },
      { type: 'error', message: expect.stringMatching(/empty/i), raw: '{{}}' },
      { type: 'text', value: ' y' },
    ]);
    expect(tokenize('{{first-name}}')).toEqual([
      {
        type: 'error',
        message: expect.stringMatching(/identifier/i),
        raw: '{{first-name}}',
      },
    ]);
    expect(tokenize('{{block:}}')).toEqual([
      { type: 'error', message: expect.any(String), raw: '{{block:}}' },
    ]);
    expect(tokenize('tail {{open')).toEqual([
      { type: 'text', value: 'tail ' },
      {
        type: 'error',
        message: expect.stringMatching(/unclosed/i),
        raw: '{{open',
      },
    ]);
  });

  it('placeholders() lists unique names in first-seen order and ignores blocks and errors', () => {
    expect(
      placeholders('{{a}} {{b | x}} {{a}} {{block:footer}} {{c}} {{bad-name}}'),
    ).toEqual(['a', 'b', 'c']);
    expect(placeholders(templates[0].body)).toEqual(['first_name', 'plan']);
    expect(placeholders('')).toEqual([]);
  });
});

describe('05 template — render', () => {
  it('substitutes vars, uses fallbacks for undefined / null / empty, stringifies numbers and booleans', () => {
    const { output, problems } = render(
      '{{a}}|{{b | fb}}|{{c | fc}}|{{d | fd}}|{{n}}|{{t}}',
      {
        vars: { a: 'A', b: undefined, c: null, d: '', n: 42, t: true },
        blocks: {},
      },
    );
    expect(output).toBe('A|fb|fc|fd|42|true');
    expect(problems).toEqual([]);
  });

  it('a missing var without fallback renders empty and records a missing_var problem per occurrence, in order', () => {
    const { output, problems } = render(
      'Hi {{first_name}}! {{greeting}} {{first_name}}',
      { vars: {}, blocks: {} },
    );
    expect(output).toBe('Hi !  ');
    expect(problems).toEqual([
      {
        kind: 'missing_var',
        message: expect.stringContaining('first_name'),
        raw: '{{first_name}}',
      },
      {
        kind: 'missing_var',
        message: expect.stringContaining('greeting'),
        raw: '{{greeting}}',
      },
      {
        kind: 'missing_var',
        message: expect.stringContaining('first_name'),
        raw: '{{first_name}}',
      },
    ]);
  });

  it('expands blocks recursively — placeholders inside blocks and blocks inside blocks — using the fixtures', () => {
    const welcome = templates.find((t) => t.id === 't1')!;
    const { output, problems } = render(welcome.body, {
      vars: { first_name: 'Ava', plan: 'pro' },
      blocks,
    });
    expect(output).toBe(
      '=== Campaign Studio ===\nHi Ava,\n\nThanks for joining on the pro plan.\n\nSent by Campaign Studio. Reply STOP to unsubscribe.',
    );
    expect(problems).toEqual([]);

    // a var inside a block is resolved from the same vars
    const withBrand = render('{{block:footer}}', {
      vars: { brand: 'ACME' },
      blocks,
    });
    expect(withBrand.output).toBe('Sent by ACME. Reply STOP to unsubscribe.');
  });

  it('reports missing_block, syntax and cycle problems; errors render as their raw text', () => {
    const broken = templates.find((t) => t.id === 't6')!;
    const result = render(broken.body, { vars: { first_name: 'Ava' }, blocks });
    expect(result.output).toBe(
      'Hello {{first_name, this one never closes and  points nowhere.',
    );
    expect(result.problems).toEqual([
      {
        kind: 'syntax',
        message: expect.stringMatching(/unclosed/i),
        raw: '{{first_name, this one never closes and ',
      },
      {
        kind: 'missing_block',
        message: expect.stringContaining('missing'),
        raw: '{{block:missing}}',
      },
    ]);

    const cyclic = render('start {{block:loop}} end', {
      vars: {},
      blocks: { loop: 'x{{block:loop}}' },
      maxDepth: 3,
    });
    expect(cyclic.output.startsWith('start x')).toBe(true);
    expect(cyclic.output.endsWith(' end')).toBe(true);
    expect(cyclic.output.length).toBeLessThan(40);
    expect(cyclic.problems).toEqual([
      { kind: 'cycle', message: expect.any(String), raw: '{{block:loop}}' },
    ]);

    const deep = render('{{block:a}}', {
      vars: {},
      blocks: { a: '{{block:b}}', b: '{{block:c}}', c: 'leaf' },
    });
    expect(deep).toEqual({ output: 'leaf', problems: [] });
  });
});

describe('05 template — smsInfo', () => {
  it('counts GSM-7 septets and segments: 160 in one, 153 per segment after that', () => {
    expect(smsInfo('')).toEqual({
      chars: 0,
      encoding: 'gsm7',
      segments: 0,
      remaining: 160,
    });
    expect(smsInfo('Hello')).toEqual({
      chars: 5,
      encoding: 'gsm7',
      segments: 1,
      remaining: 155,
    });
    expect(smsInfo('a'.repeat(160))).toEqual({
      chars: 160,
      encoding: 'gsm7',
      segments: 1,
      remaining: 0,
    });
    expect(smsInfo('a'.repeat(161))).toEqual({
      chars: 161,
      encoding: 'gsm7',
      segments: 2,
      remaining: 145,
    });
    expect(smsInfo('a'.repeat(306))).toEqual({
      chars: 306,
      encoding: 'gsm7',
      segments: 2,
      remaining: 0,
    });
    expect(smsInfo('a'.repeat(307)).segments).toBe(3);
    // extension-table characters cost two septets
    expect(smsInfo('€')).toEqual({
      chars: 2,
      encoding: 'gsm7',
      segments: 1,
      remaining: 158,
    });
    expect(smsInfo('ñ ü £').encoding).toBe('gsm7');
  });

  it('switches to UCS-2 (70 / 67 per segment, UTF-16 code units) when a character is outside GSM 03.38', () => {
    expect(smsInfo('Hi 😀')).toEqual({
      chars: 5,
      encoding: 'ucs2',
      segments: 1,
      remaining: 65,
    });
    expect(smsInfo('你好')).toEqual({
      chars: 2,
      encoding: 'ucs2',
      segments: 1,
      remaining: 68,
    });
    expect(smsInfo('ß'.repeat(70) + '中')).toEqual({
      chars: 71,
      encoding: 'ucs2',
      segments: 2,
      remaining: 63,
    });
  });
});
