import { tokenize, render, placeholders, Token } from './template_tokenizer';

const text = (value: string): Token => ({ type: 'text', value });
const ph = (name: string, raw: string, fallback: string | null = null): Token => ({
  type: 'placeholder',
  name,
  fallback,
  raw,
});
const err = (message: string, index: number): Token => ({ type: 'error', message, index });

describe('tokenize — basics', () => {
  it('returns [] for an empty template and one text token for plain text', () => {
    expect(tokenize('')).toEqual([]);
    expect(tokenize('Hello world')).toEqual([text('Hello world')]);
  });

  it('lexes a simple placeholder with surrounding text', () => {
    expect(tokenize('Hi {{ first_name }}!')).toEqual([
      text('Hi '),
      ph('first_name', '{{ first_name }}'),
      text('!'),
    ]);
  });

  it('trims whitespace around the name but keeps raw verbatim', () => {
    expect(tokenize('{{plan}}')).toEqual([ph('plan', '{{plan}}')]);
    expect(tokenize('{{   plan\t}}')).toEqual([ph('plan', '{{   plan\t}}')]);
  });

  it('splits name and fallback on the first | and trims both', () => {
    expect(tokenize('{{ first_name | there }}')).toEqual([
      ph('first_name', '{{ first_name | there }}', 'there'),
    ]);
    expect(tokenize('{{ a | b | c }}')).toEqual([ph('a', '{{ a | b | c }}', 'b | c')]);
  });

  it('distinguishes no fallback (null) from an empty fallback ("")', () => {
    expect(tokenize('{{ a }}')[0]).toEqual(ph('a', '{{ a }}'));
    expect(tokenize('{{ a | }}')[0]).toEqual(ph('a', '{{ a | }}', ''));
    expect(tokenize('{{a|}}')[0]).toEqual(ph('a', '{{a|}}', ''));
  });

  it('accepts dotted and underscored names', () => {
    expect(tokenize('{{user.first_name}} {{ _x.y.z }} {{ A9 }}')).toEqual([
      ph('user.first_name', '{{user.first_name}}'),
      text(' '),
      ph('_x.y.z', '{{ _x.y.z }}'),
      text(' '),
      ph('A9', '{{ A9 }}'),
    ]);
  });
});

describe('tokenize — adjacency and escapes', () => {
  it('lexes adjacent placeholders with no text token between them', () => {
    expect(tokenize('{{a}}{{b}}')).toEqual([ph('a', '{{a}}'), ph('b', '{{b}}')]);
    expect(tokenize('{{a}}{{b}}{{c}}')).toHaveLength(3);
  });

  it('turns \\{{ into literal {{ text and drops the backslash', () => {
    expect(tokenize('Use \\{{ like this }}')).toEqual([text('Use {{ like this }}')]);
  });

  it('an escape followed by a real placeholder lexes both correctly', () => {
    expect(tokenize('\\{{ not }} {{ real }}')).toEqual([
      text('{{ not }} '),
      ph('real', '{{ real }}'),
    ]);
    expect(tokenize('\\{{{{ real }}')).toEqual([text('{{'), ph('real', '{{ real }}')]);
  });

  it('a backslash anywhere else is ordinary text', () => {
    expect(tokenize('a\\b \\ {{ x }}')).toEqual([text('a\\b \\ '), ph('x', '{{ x }}')]);
  });

  it('a lone { or } is ordinary text', () => {
    expect(tokenize('{ not } a }} placeholder')).toEqual([text('{ not } a }} placeholder')]);
  });

  it('never emits two adjacent text tokens or empty text tokens', () => {
    const toks = tokenize('a\\{{b\\{{c {{ 1bad }} d {{ 2bad }}{{ ok }}');
    for (let i = 1; i < toks.length; i++) {
      expect(toks[i - 1].type === 'text' && toks[i].type === 'text').toBe(false);
    }
    for (const t of toks) if (t.type === 'text') expect(t.value).not.toBe('');
  });
});

describe('tokenize — errors', () => {
  it('reports an invalid name and keeps the raw as text, merged with following text', () => {
    expect(tokenize('Hello {{ 1st }}!')).toEqual([
      text('Hello '),
      err('Invalid placeholder name "1st"', 6),
      text('{{ 1st }}!'),
    ]);
  });

  it('flags names with spaces, dashes, or empty names', () => {
    expect(tokenize('{{ first name }}')[0]).toEqual(err('Invalid placeholder name "first name"', 0));
    expect(tokenize('{{ first-name }}')[0]).toEqual(err('Invalid placeholder name "first-name"', 0));
    expect(tokenize('{{}}')[0]).toEqual(err('Invalid placeholder name ""', 0));
    expect(tokenize('{{ | x }}')[0]).toEqual(err('Invalid placeholder name ""', 0));
  });

  it('the raw text of an invalid placeholder merges with the text before the next token', () => {
    expect(tokenize('{{ 9 }}{{ ok }}')).toEqual([
      err('Invalid placeholder name "9"', 0),
      text('{{ 9 }}'),
      ph('ok', '{{ ok }}'),
    ]);
  });

  it('an unclosed placeholder yields one error covering the rest and stops', () => {
    expect(tokenize('Hi {{ name')).toEqual([text('Hi '), err('Unclosed placeholder at 3', 3)]);
    expect(tokenize('{{ a }} then {{ b | x and {{ c }')).toEqual([
      ph('a', '{{ a }}'),
      text(' then '),
      err('Unclosed placeholder at 13', 13),
    ]);
  });

  it('an unclosed placeholder right at the end still reports its index', () => {
    expect(tokenize('abc{{')).toEqual([text('abc'), err('Unclosed placeholder at 3', 3)]);
  });

  it('never throws on hostile input', () => {
    for (const s of ['{{', '}}', '{{}}}}', '\\', '\\{{', '{{{{', '{{ a {{ b }}', '|', '{{|}}']) {
      expect(() => tokenize(s)).not.toThrow();
    }
  });
});

describe('render', () => {
  it('substitutes known names and uses fallbacks for unknown ones', () => {
    expect(render('Hi {{ first_name | there }}, {{ plan }}!', { plan: 'Pro' })).toEqual({
      text: 'Hi there, Pro!',
      unknown: [],
    });
    expect(render('Hi {{ first_name | there }}', { first_name: 'Ada' }).text).toBe('Hi Ada');
  });

  it('keeps raw and records unknown names once, in first-seen order', () => {
    const out = render('{{ region }} {{ city }} {{ region }}', {});
    expect(out).toEqual({
      text: '{{ region }} {{ city }} {{ region }}',
      unknown: ['region', 'city'],
    });
  });

  it('treats an empty-string value as present and undefined as missing', () => {
    expect(render('[{{ a }}][{{ b | fb }}]', { a: '', b: undefined })).toEqual({
      text: '[][fb]',
      unknown: [],
    });
  });

  it('does not count names resolved by a fallback as unknown', () => {
    expect(render('{{ a | x }}{{ b }}', {}).unknown).toEqual(['b']);
  });

  it('renders escapes as literal braces and invalid placeholders verbatim', () => {
    expect(render('\\{{ a }} {{ 1a }} {{ a }}', { a: 'A' })).toEqual({
      text: '{{ a }} {{ 1a }} A',
      unknown: [],
    });
  });

  it('renders the remainder verbatim after an unclosed placeholder', () => {
    expect(render('Hi {{ a }}, {{ b', { a: 'Ada' })).toEqual({ text: 'Hi Ada, {{ b', unknown: [] });
  });

  it('resolves dotted names as flat keys in vars', () => {
    expect(render('{{ user.first_name }}', { 'user.first_name': 'Ada' }).text).toBe('Ada');
  });
});

describe('placeholders', () => {
  it('lists unique valid names in order of first appearance', () => {
    expect(placeholders('{{a}} {{ b | x }} {{a}} {{ c.d }}')).toEqual(['a', 'b', 'c.d']);
  });

  it('ignores invalid, escaped, and unclosed placeholders', () => {
    expect(placeholders('\\{{ e }} {{ 1x }} {{ ok }} {{ unclosed')).toEqual(['ok']);
    expect(placeholders('plain')).toEqual([]);
  });
});

describe('scale', () => {
  it('tokenizes a 100k-character template in a single pass', () => {
    const unit = 'Hi {{ first_name | there }}, \\{{ not }} {{ plan }} ';
    const src = unit.repeat(Math.ceil(100_000 / unit.length));
    const start = performance.now();
    const toks = tokenize(src);
    const elapsed = performance.now() - start;
    expect(toks.filter((t) => t.type === 'placeholder')).toHaveLength(
      2 * Math.ceil(100_000 / unit.length),
    );
    expect(toks.some((t) => t.type === 'error')).toBe(false);
    expect(elapsed).toBeLessThan(200);
  });
});
