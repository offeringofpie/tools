import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const outputDir = resolve(import.meta.dirname, '../public/data/icons');

const readJson = (specifier) =>
  JSON.parse(readFileSync(require.resolve(specifier), 'utf8'));

const stripSuffix = (name, suffixes) => {
  for (const suffix of suffixes)
    if (name.endsWith(`-${suffix}`)) return name.slice(0, -(suffix.length + 1));
  return name;
};

const identity = (name) => name;
const heroBaseName = (name) =>
  stripSuffix(name, ['16-solid', '20-solid', 'solid']);
const phBaseName = (name) =>
  stripSuffix(name, ['bold', 'duotone', 'fill', 'light', 'thin']);
const solarBaseName = (name) =>
  stripSuffix(name, ['linear', 'outline', 'bold', 'broken', 'duotone']);

const lucideTags = readJson('lucide-static/tags.json');

const sets = [
  { pkg: 'heroicons', lib: 'heroicons', baseName: heroBaseName },
  { pkg: 'lucide', lib: 'lucide', tags: lucideTags },
  { pkg: 'ph', lib: 'ph', baseName: phBaseName, width: 256, height: 256 },
  { pkg: 'solar', lib: 'solar', baseName: solarBaseName },
  { pkg: 'fa6-solid', lib: 'fa6', width: 512, height: 512 },
  { pkg: 'fa6-regular', lib: 'fa6', width: 512, height: 512 },
  { pkg: 'fa6-brands', lib: 'fa6', width: 512, height: 512 },
  { pkg: 'carbon', lib: 'carbon', width: 32, height: 32 },
  { pkg: 'simple-icons', lib: 'simple-icons' },
];

function buildSet(set) {
  const { icons } = readJson(`@iconify-json/${set.pkg}/icons.json`);
  const baseName = set.baseName ?? identity;
  const tags = set.tags ?? {};

  return {
    lib: set.lib,
    width: set.width ?? 24,
    height: set.height ?? 24,
    icons: Object.entries(icons).map(([key, icon]) => {
      return {
        key,
        name: baseName(key),
        body: icon.body,
        w: icon.width,
        h: icon.height,
        tags: tags[key],
      };
    }),
  };
}

function main() {
  mkdirSync(outputDir, { recursive: true });

  for (const set of sets) {
    const file = resolve(outputDir, `${set.pkg}.json`);
    writeFileSync(file, JSON.stringify(buildSet(set)));
  }

  console.log(`Complete!`);
}

main();
