import { mkdirSync, writeFileSync } from 'fs';
import { get } from 'https';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputFile = resolve(__dirname, '../public/data/character-map.json');

/* UnicodeData.txt is the primary data file of the Unicode Character Database
 ** (UCD), published by the Unicode Consortium. It is a semicolon-delimited
 ** list of every assigned code point. The fields used here are field 0
 ** (code point in hex), field 1 (name), and field 2 (general category).
 ** Full field documentation: https://www.unicode.org/reports/tr44/
 ** Using the "latest" path means the script always pulls the current
 ** Unicode version rather than being pinned to a specific release. */
const UNICODE_DATA_URL =
  'https://unicode.org/Public/UCD/latest/ucd/UnicodeData.txt';

function downloadText(url) {
  return new Promise((resolve, reject) => {
    get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadText(response.headers.location).then(resolve, reject);
        return;
      }
      let body = '';
      response.on('data', (chunk) => {
        body += chunk;
      });
      response.on('end', () => resolve(body));
      response.on('error', reject);
    }).on('error', reject);
  });
}

// https://www.unicode.org/reports/tr44/#General_Category_Values
const categoryNames = {
  Lu: 'Uppercase Letters',
  Ll: 'Lowercase Letters',
  Lt: 'Titlecase Letters',
  Lm: 'Modifier Letters',
  Lo: 'Other Letters',
  Nd: 'Decimal Digits',
  Nl: 'Number Letters',
  No: 'Other Numbers',
  Pc: 'Connector Punctuation',
  Pd: 'Dash Punctuation',
  Ps: 'Open Punctuation',
  Pe: 'Close Punctuation',
  Pi: 'Initial Punctuation',
  Pf: 'Final Punctuation',
  Po: 'Other Punctuation',
  Sm: 'Math Symbols',
  Sc: 'Currency Symbols',
  Sk: 'Modifier Symbols',
  So: 'Other Symbols',
  Zs: 'Space Separators',
};

// (L = Letter, N = Number, P = Punctuation, S = Symbol, Z = Separator)
const categoryGroups = {
  Lu: 'Letters',
  Ll: 'Letters',
  Lt: 'Letters',
  Lm: 'Letters',
  Lo: 'Letters',
  Nd: 'Numbers',
  Nl: 'Numbers',
  No: 'Numbers',
  Pc: 'Punctuation',
  Pd: 'Punctuation',
  Ps: 'Punctuation',
  Pe: 'Punctuation',
  Pi: 'Punctuation',
  Pf: 'Punctuation',
  Po: 'Punctuation',
  Sm: 'Symbols',
  Sc: 'Symbols',
  Sk: 'Symbols',
  So: 'Symbols',
  Zs: 'Separators',
};

//  Cc control, Cf format, Cs surrogate, Co private-use, Cn unassigned, Mn/Mc/Me combining marks, Zl line separator, Zp paragraph separator
const excludedCategories = new Set([
  'Cc',
  'Cf',
  'Cs',
  'Co',
  'Cn',
  'Mn',
  'Mc',
  'Me',
  'Zl',
  'Zp',
]);

// https://www.unicode.org/Public/UCD/latest/ucd/Blocks.txt
const unicodeBlocks = [
  [0x0000, 0x007f, 'Basic Latin'],
  [0x0080, 0x00ff, 'Latin-1 Supplement'],
  [0x0100, 0x017f, 'Latin Extended-A'],
  [0x0180, 0x024f, 'Latin Extended-B'],
  [0x0370, 0x03ff, 'Greek and Coptic'],
  [0x0400, 0x04ff, 'Cyrillic'],
  [0x0500, 0x052f, 'Cyrillic Supplement'],
  [0x0600, 0x06ff, 'Arabic'],
  [0x0900, 0x097f, 'Devanagari'],
  [0x0e00, 0x0e7f, 'Thai'],
  [0x1d00, 0x1dbf, 'Phonetic Extensions'],
  [0x2000, 0x206f, 'General Punctuation'],
  [0x2070, 0x209f, 'Superscripts and Subscripts'],
  [0x20a0, 0x20cf, 'Currency Symbols'],
  [0x2100, 0x214f, 'Letterlike Symbols'],
  [0x2150, 0x218f, 'Number Forms'],
  [0x2190, 0x21ff, 'Arrows'],
  [0x2200, 0x22ff, 'Mathematical Operators'],
  [0x2300, 0x23ff, 'Miscellaneous Technical'],
  [0x2400, 0x243f, 'Control Pictures'],
  [0x2440, 0x245f, 'Optical Char Recognition'],
  [0x2460, 0x24ff, 'Enclosed Alphanumerics'],
  [0x2500, 0x257f, 'Box Drawing'],
  [0x2580, 0x259f, 'Block Elements'],
  [0x25a0, 0x25ff, 'Geometric Shapes'],
  [0x2600, 0x26ff, 'Miscellaneous Symbols'],
  [0x2700, 0x27bf, 'Dingbats'],
  [0x27c0, 0x27ef, 'Misc Mathematical Symbols-A'],
  [0x2900, 0x297f, 'Supplemental Arrows-B'],
  [0x2a00, 0x2aff, 'Supplemental Math Operators'],
  [0x3000, 0x303f, 'CJK Symbols and Punctuation'],
  [0x3040, 0x309f, 'Hiragana'],
  [0x30a0, 0x30ff, 'Katakana'],
  [0x1f000, 0x1f02f, 'Mahjong Tiles'],
  [0x1f300, 0x1f5ff, 'Misc Symbols and Pictographs'],
  [0x1f600, 0x1f64f, 'Emoticons'],
  [0x1f650, 0x1f67f, 'Ornamental Dingbats'],
  [0x1f680, 0x1f6ff, 'Transport and Map'],
  [0x1f900, 0x1f9ff, 'Supplemental Symbols and Pictographs'],
  [0x1fa00, 0x1fa6f, 'Chess Symbols'],
  [0x1fa70, 0x1faff, 'Symbols and Pictographs Extended-A'],
];

function findBlock(point) {
  for (const [start, end, name] of unicodeBlocks) {
    if (point >= start && point <= end) return name;
  }
  return 'Other';
}

// https://html.spec.whatwg.org/multipage/named-characters.html
const htmlEntities = {
  0x0022: '&quot;',
  0x0026: '&amp;',
  0x0027: '&apos;',
  0x003c: '&lt;',
  0x003e: '&gt;',
  0x00a0: '&nbsp;',
  0x00a1: '&iexcl;',
  0x00a2: '&cent;',
  0x00a3: '&pound;',
  0x00a4: '&curren;',
  0x00a5: '&yen;',
  0x00a6: '&brvbar;',
  0x00a7: '&sect;',
  0x00a8: '&uml;',
  0x00a9: '&copy;',
  0x00aa: '&ordf;',
  0x00ab: '&laquo;',
  0x00ac: '&not;',
  0x00ae: '&reg;',
  0x00b0: '&deg;',
  0x00b1: '&plusmn;',
  0x00b4: '&acute;',
  0x00b6: '&para;',
  0x00b7: '&middot;',
  0x00bb: '&raquo;',
  0x00bf: '&iquest;',
  0x00c0: '&Agrave;',
  0x00c1: '&Aacute;',
  0x00c2: '&Acirc;',
  0x00c3: '&Atilde;',
  0x00c4: '&Auml;',
  0x00c5: '&Aring;',
  0x00c6: '&AElig;',
  0x00c7: '&Ccedil;',
  0x00d7: '&times;',
  0x00f7: '&divide;',
  0x00e0: '&agrave;',
  0x00e1: '&aacute;',
  0x00e2: '&acirc;',
  0x00e3: '&atilde;',
  0x00e4: '&auml;',
  0x00e5: '&aring;',
  0x00e6: '&aelig;',
  0x00e7: '&ccedil;',
  0x2013: '&ndash;',
  0x2014: '&mdash;',
  0x2018: '&lsquo;',
  0x2019: '&rsquo;',
  0x201c: '&ldquo;',
  0x201d: '&rdquo;',
  0x2026: '&hellip;',
  0x2022: '&bull;',
  0x2190: '&larr;',
  0x2191: '&uarr;',
  0x2192: '&rarr;',
  0x2193: '&darr;',
  0x2194: '&harr;',
  0x21d4: '&hArr;',
  0x2200: '&forall;',
  0x2202: '&part;',
  0x2203: '&exist;',
  0x2205: '&empty;',
  0x2207: '&nabla;',
  0x2208: '&isin;',
  0x2209: '&notin;',
  0x220b: '&ni;',
  0x220f: '&prod;',
  0x2211: '&sum;',
  0x2212: '&minus;',
  0x2217: '&lowast;',
  0x221a: '&radic;',
  0x221d: '&prop;',
  0x221e: '&infin;',
  0x2220: '&ang;',
  0x2227: '&and;',
  0x2228: '&or;',
  0x2229: '&cap;',
  0x222a: '&cup;',
  0x222b: '&int;',
  0x2234: '&there4;',
  0x223c: '&sim;',
  0x2245: '&cong;',
  0x2248: '&asymp;',
  0x2260: '&ne;',
  0x2261: '&equiv;',
  0x2264: '&le;',
  0x2265: '&ge;',
  0x2282: '&sub;',
  0x2283: '&sup;',
  0x2284: '&nsub;',
  0x2286: '&sube;',
  0x2287: '&supe;',
  0x2295: '&oplus;',
  0x2297: '&otimes;',
  0x22a5: '&perp;',
  0x22c5: '&sdot;',
  0x2308: '&lceil;',
  0x2309: '&rceil;',
  0x230a: '&lfloor;',
  0x230b: '&rfloor;',
  0x25ca: '&loz;',
  0x2660: '&spades;',
  0x2663: '&clubs;',
  0x2665: '&hearts;',
  0x2666: '&diams;',
  0x0391: '&Alpha;',
  0x0392: '&Beta;',
  0x0393: '&Gamma;',
  0x0394: '&Delta;',
  0x03b1: '&alpha;',
  0x03b2: '&beta;',
  0x03b3: '&gamma;',
  0x03b4: '&delta;',
  0x03c0: '&pi;',
  0x03c3: '&sigma;',
  0x03c4: '&tau;',
  0x03c9: '&omega;',
};

function makeKeywords(name) {
  return name
    .toLowerCase()
    .split(/[\s-]+/)
    .filter((word) => word.length > 1);
}

function summarize(counts) {
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function main() {
  console.log('Fetching...');
  const rawData = await downloadText(UNICODE_DATA_URL);

  console.log('Parsing...');
  const characters = [];
  let skipped = 0;

  for (const line of rawData.trim().split('\n')) {
    const [codePointHex, name, category] = line.split(';');
    if (!category) continue;

    if (name.startsWith('<') || excludedCategories.has(category)) {
      skipped++;
      continue;
    }

    const codePoint = parseInt(codePointHex, 16);
    const character = {
      cp: codePoint,
      hex: codePointHex.toLowerCase().padStart(4, '0'),
      char: String.fromCodePoint(codePoint),
      name,
      cat: category,
      catName: categoryNames[category] ?? category,
      group: categoryGroups[category] ?? 'Other',
      block: findBlock(codePoint),
      keywords: makeKeywords(name),
    };

    if (htmlEntities[codePoint]) {
      character.entity = htmlEntities[codePoint];
    }

    characters.push(character);
  }

  console.log(`Parsed ${characters.length} characters (skipped ${skipped})`);

  const groupCounts = {};
  const blockCounts = {};
  for (const { group, block } of characters) {
    groupCounts[group] = (groupCounts[group] ?? 0) + 1;
    blockCounts[block] = (blockCounts[block] ?? 0) + 1;
  }

  const output = {
    meta: {
      generated: new Date().toISOString(),
      source: UNICODE_DATA_URL,
      total: characters.length,
      groups: summarize(groupCounts),
      blocks: summarize(blockCounts),
    },
    characters,
  };

  mkdirSync(dirname(outputFile), { recursive: true });
  writeFileSync(outputFile, JSON.stringify(output));
  console.log(`Written to ${outputFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
