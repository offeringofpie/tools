import { describe, it, expect } from 'vitest';
import { parseRegex, dict } from './RegexHelper.vue';

describe('RegexHelper', () => {
  it('parses literal strings', () => {
    const res = parseRegex('abc');
    expect(res).toEqual([{ token: 'abc', desc: 'Literal match', depth: 0 }]);
  });

  it('parses character classes and anchors', () => {
    const res = parseRegex('^\\d+$');
    expect(res[0].token).toBe('^');
    expect(res[1].token).toBe('\\d');
    expect(res[2].token).toBe('+');
    expect(res[3].token).toBe('$');
  });

  it('differentiates between greedy and lazy', () => {
    const res = parseRegex('a*?b+');

    const lazy = res.find((r) => r.token === '*?');
    const greedy = res.find((r) => r.token === '+');

    expect(lazy?.desc).toContain('(lazy)');
    expect(greedy?.desc).not.toContain('(lazy)');
  });

  it('identifies character sets', () => {
    const res = parseRegex('[a-z][^0-9]');

    expect(res.find((r) => r.token === '[a-z]')?.desc).toBe(dict['[']);
    expect(res.find((r) => r.token === '[^0-9]')?.desc).toBe(dict['[^']);
  });

  it('returns an empty array when empty', () => {
    expect(parseRegex('')).toEqual([]);
  });
});
