import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const outputFile = resolve(
  import.meta.dirname,
  '../public/data/icon-search.json',
);

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

function loadSet(set) {
  const { icons } = readJson(`@iconify-json/${set.pkg}/icons.json`);
  const baseName = set.baseName ?? identity;
  const tags = set.tags ?? {};

  return Object.entries(icons).map(([name, icon]) => {
    return {
      id: `${set.pkg}:${name}`,
      name: baseName(name),
      lib: set.lib,
      tags: tags[name] ?? [],
      body: icon.body,
      w: icon.width ?? set.width ?? 24,
      h: icon.height ?? set.height ?? 24,
    };
  });
}

function countByLib(icons) {
  return icons.reduce((counts, icon) => {
    counts[icon.lib] = (counts[icon.lib] ?? 0) + 1;
    return counts;
  }, {});
}

function main() {
  const icons = sets.flatMap(loadSet);

  const output = {
    meta: {
      generated: new Date().toISOString(),
      total: icons.length,
      libs: countByLib(icons),
    },
    icons,
  };

  mkdirSync(dirname(outputFile), { recursive: true });
  writeFileSync(outputFile, JSON.stringify(output));
  console.log(`Complete!`);
}

main();
