import { describe, it, expect } from 'vitest';
import {
  detectCode,
  minifyHTML,
  minifyCSS,
  minifyJavaScript,
  minifySVG,
  beautifyHTML,
  beautifyCSS,
  beautifyJavaScript,
} from './MinifyBeautify.vue';

describe('detectCode', () => {
  it('picks up SVG', () => {
    expect(detectCode('<svg viewBox="0 0 24 24"></svg>')).toBe('svg');
    expect(detectCode('<svg xmlns="http://www.w3.org/2000/svg"></svg>')).toBe(
      'svg',
    );
  });

  it('picks up HTML', () => {
    expect(detectCode('<!DOCTYPE html><html></html>')).toBe('html');
    expect(detectCode('<div>hello</div>')).toBe('html');
  });

  it('picks up CSS', () => {
    expect(detectCode('body { color: rebeccapurple; }')).toBe('css');
    expect(detectCode('.box { width: 420px; }')).toBe('css');
  });

  it('picks up JavaScript', () => {
    expect(detectCode('const x = 1')).toBe('javascript');
    expect(detectCode('function hello() {}')).toBe('javascript');
    expect(detectCode('const fn = () => true')).toBe('javascript');
  });

  it('falls back to html for unrecognised input', () => {
    expect(detectCode('hello world')).toBe('html');
  });
});

describe('minifyHTML', () => {
  it('strips comments and collapses whitespace between tags', () => {
    expect(minifyHTML('<div>  \n  <span>x</span>  \n  </div>')).toBe(
      '<div><span>x</span></div>',
    );
  });
});

describe('minifyCSS', () => {
  it('strips comments and removes unnecessary whitespace', () => {
    const result = minifyCSS('/* comment */ body { color : red ; }');
    expect(result).toBe('body{color:red}');
  });
});

describe('minifyJavaScript', () => {
  it('strips block and line comments', () => {
    const result = minifyJavaScript('/* block */ const x = 1 // inline');
    expect(result).not.toContain('//');
    expect(result).not.toContain('/*');
  });

  it('leaves URLs inside strings alone', () => {
    expect(minifyJavaScript('const url = "https://example.com"')).toContain(
      'https://example.com',
    );
  });
});

describe('minifySVG', () => {
  it('strips XML declaration, comments and extra whitespace', () => {
    const result = minifySVG('<?xml version="1.0"?><svg>  <path/>  </svg>');
    expect(result).toBe('<svg><path/></svg>');
    expect(result).not.toContain('<?xml');
  });

  it('removes spaces around = in attributes', () => {
    expect(minifySVG('<svg viewBox = "0 0 24 24">')).toContain(
      'viewBox="0 0 24 24"',
    );
  });
});

describe('beautifyHTML', () => {
  it('indents nested tags and unindents closing tags', () => {
    const result = beautifyHTML('<ul><li>a</li></ul>');
    expect(result).toBe('<ul>\n  <li>a</li>\n</ul>');
  });

  it("doesn't indent after void elements", () => {
    const result = beautifyHTML('<div><br></div>');
    const lines = result.split('\n');
    expect(lines.every((l) => !l.startsWith('    '))).toBe(true);
  });
});

describe('beautifyCSS', () => {
  it('puts properties on their own indented lines with closing brace unindented', () => {
    const result = beautifyCSS('body{color:rebeccapurple;}');
    expect(result).toBe('body {\n  color:rebeccapurple;\n}');
  });
});

describe('beautifyJavaScript', () => {
  it('indents inside braces and puts closing brace on its own line', () => {
    const result = beautifyJavaScript('function x() {const a = 1;}');
    expect(result).toContain('  const a = 1;');
    expect(result.split('\n').at(-1)).toBe('}');
  });
});
