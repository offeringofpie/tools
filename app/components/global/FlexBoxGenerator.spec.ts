import { describe, it, expect } from 'vitest';
import { toNum, parsePx, newItem, styleFor, containerStyle, buildCss } from './FlexboxGenerator.vue';

const row = { direction: 'row', wrap: 'nowrap', justifyContent: 'flex-start', justifyItems: 'normal', alignItems: 'stretch', alignContent: 'normal' };

describe('toNum()', () => {
  it('parses an integer string', () => expect(toNum('42')).toBe(42));
  it('parses a float string',   () => expect(toNum('3.14')).toBe(3.14));
  it('returns null on a non-number', () => expect(toNum('abc')).toBeNull());
  it('returns null on empty string', () => expect(toNum('')).toBeNull());
});

describe('parsePx()', () => {
  it('returns "0px" for empty or whitespace', () => {
    expect(parsePx('')).toBe('0px');
    expect(parsePx('   ')).toBe('0px');
  });

  it('passes through values with a unit', () => {
    expect(parsePx('16px')).toBe('16px');
    expect(parsePx('2rem')).toBe('2rem');
    expect(parsePx('50%')).toBe('50%');
    expect(parsePx('10vw')).toBe('10vw');
    expect(parsePx('100vh')).toBe('100vh');
    expect(parsePx('1.5em')).toBe('1.5em');
  });

  it('appends "px" to bare numbers', () => {
    expect(parsePx('16')).toBe('16px');
    expect(parsePx('0')).toBe('0px');
  });

  it('returns "0px" for non-numeric strings', () => expect(parsePx('abc')).toBe('0px'));
});

describe('newItem()', () => {
  it('has default width and height', () => {
    expect(newItem(0).width).toBe('20%');
    expect(newItem(0).height).toBe('5rem');
  });

  it('applies overrides on top of defaults', () => {
    const item = newItem(0, { grow: 1, width: '50%' });
    expect(item.grow).toBe(1);
    expect(item.width).toBe('50%');
    expect(item.height).toBe('5rem');
  });
});

describe('styleFor()', () => {
  it('defaults flexShrink to 0', () => expect(styleFor(newItem(0)).flexShrink).toBe('0'));
  it('uses item shrink when set', () => expect(styleFor(newItem(0, { shrink: 2 })).flexShrink).toBe('2'));
  it('includes flexGrow when set', () => expect(styleFor(newItem(0, { grow: 1 })).flexGrow).toBe('1'));

  it('includes width and height when set', () => {
    const style = styleFor(newItem(0, { width: '100px', height: '3rem' }));
    expect(style.width).toBe('100px');
    expect(style.height).toBe('3rem');
  });

  it('includes flexBasis, alignSelf and order when set', () => {
    const style = styleFor(newItem(0, { basis: 'auto', alignSelf: 'center', order: 2 }));
    expect(style.flexBasis).toBe('auto');
    expect(style.alignSelf).toBe('center');
    expect(style.order).toBe('2');
  });
});

describe('containerStyle()', () => {
  it('uses shorthand gap when row === col', () => {
    const style = containerStyle(row, 'flex', '16');
    expect(style.gap).toBe('16px');
    expect(style.rowGap).toBeUndefined();
    expect(style.columnGap).toBeUndefined();
  });

  it('uses rowGap / columnGap when values differ', () => {
    const style = containerStyle(row, 'flex', '20px 10px');
    expect(style.rowGap).toBe('20px');
    expect(style.columnGap).toBe('10px');
    expect(style.gap).toBeUndefined();
  });

  it('forwards display, flexDirection and flexWrap', () => {
    const style = containerStyle({ ...row, direction: 'column', wrap: 'wrap' }, 'inline-flex', '0');
    expect(style.display).toBe('inline-flex');
    expect(style.flexDirection).toBe('column');
    expect(style.flexWrap).toBe('wrap');
  });
});

describe('buildCss()', () => {
  const css = (overrides = {}, items = []) => buildCss({ ...row, ...overrides }, 'flex', '0', items);

  it('always opens with a .container block', () => expect(css()).toMatch(/^\.container \{/));
  it('includes flex-flow shorthand',         () => expect(css({ wrap: 'wrap' })).toContain('flex-flow: row wrap;'));

  it('omits justify-items when "normal"',    () => expect(css()).not.toContain('justify-items'));
  it('includes justify-items when not "normal"', () => expect(css({ justifyItems: 'center' })).toContain('justify-items: center;'));

  it('omits align-content when "normal"',    () => expect(css()).not.toContain('align-content'));
  it('includes align-content when not "normal"', () => expect(css({ alignContent: 'space-between' })).toContain('align-content: space-between;'));
});