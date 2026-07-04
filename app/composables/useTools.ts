import type { NavigationMenuItem } from '@nuxt/ui';

export interface ToolItem extends NavigationMenuItem {
  id: string;
  description: string;
  category: string;
}

export interface ToolConfig {
  category: string;
  icon: string;
  description: string;
  title?: string;
}

export interface CategoryConfig {
  color: string;
  icon: string;
}

export const categories: Record<string, CategoryConfig> = {
  General: { color: 'secondary', icon: 'i-heroicons-home' },
  Text: { color: 'warning', icon: 'i-heroicons-document-text' },
  Code: { color: 'primary', icon: 'i-heroicons-code-bracket' },
  Design: { color: 'success', icon: 'i-heroicons-swatch' },
  Web: { color: 'info', icon: 'i-heroicons-globe-alt' },
  Math: { color: 'error', icon: 'i-heroicons-calculator' },
  Other: { color: 'base-300', icon: 'i-heroicons-swatch' },
};

interface ColorClass {
  text: string;
  hoverRing: string;
  groupHoverText: string;
  activeText: string;
}

// Literal class strings so Tailwind can see them; never interpolate `text-${color}`.
export const colorClasses: Record<string, ColorClass> = {
  primary: {
    text: 'text-primary',
    hoverRing: 'hover:ring-primary',
    groupHoverText: 'group-hover:text-primary',
    activeText: 'group-data-[active]:text-primary',
  },
  secondary: {
    text: 'text-secondary',
    hoverRing: 'hover:ring-secondary',
    groupHoverText: 'group-hover:text-secondary',
    activeText: 'group-data-[active]:text-secondary',
  },
  success: {
    text: 'text-success',
    hoverRing: 'hover:ring-success',
    groupHoverText: 'group-hover:text-success',
    activeText: 'group-data-[active]:text-success',
  },
  info: {
    text: 'text-info',
    hoverRing: 'hover:ring-info',
    groupHoverText: 'group-hover:text-info',
    activeText: 'group-data-[active]:text-info',
  },
  warning: {
    text: 'text-warning',
    hoverRing: 'hover:ring-warning',
    groupHoverText: 'group-hover:text-warning',
    activeText: 'group-data-[active]:text-warning',
  },
  error: {
    text: 'text-error',
    hoverRing: 'hover:ring-error',
    groupHoverText: 'group-hover:text-error',
    activeText: 'group-data-[active]:text-error',
  },
  'base-300': {
    text: 'text-base-300',
    hoverRing: 'hover:ring-base-300',
    groupHoverText: 'group-hover:text-base-300',
    activeText: 'group-data-[active]:text-base-300',
  },
};

export function colours(category: string): ColorClass {
  return colorClasses[categories[category]?.color ?? 'primary'] ?? colorClasses.primary!;
}

const order = ['General', 'Code', 'Design', 'Text', 'Web', 'Math', 'Other'];

export const config: Record<string, ToolConfig> = {
  // PeriodicTable: {
  //   category: 'General',
  //   description: 'Table information of all the elements',
  //   icon: 'i-heroicons-beaker',
  // },
  WhatIsMyIp: {
    category: 'General',
    description: 'Your public IP and network info.',
    icon: 'i-heroicons-map-pin',
    title: 'What is my IP?',
  },
  // DecisionRoulette: {
  //   category: 'General',
  //   description: 'Spin a wheel to make random decisions.',
  //   icon: 'i-heroicons-arrow-path',
  //   title: 'Decision Roulette',
  // },
  Weather: {
    category: 'General',
    description: 'Weather forecast with map.',
    icon: 'i-heroicons-sun',
  },
  UnitConverter: {
    category: 'Math',
    description: 'Convert between units of length, weight, temperature, etc.',
    icon: 'i-heroicons-arrows-right-left',
  },
  TimeConverter: {
    category: 'Math',
    description: 'Convert time between different formats.',
    icon: 'i-heroicons-clock',
  },
  MarkdownEditor: {
    category: 'Text',
    description: 'A clean, distraction-free Markdown writing environment.',
    icon: 'i-heroicons-document-text',
  },
  LoremIpsum: {
    category: 'Text',
    description:
      'Generate placeholder text in Lorem, Hipster, or Bacon flavors.',
    icon: 'i-heroicons-document-duplicate',
  },
  // PdfHelper: {
  //   category: 'Text',
  //   description:
  //     'Create or Optimise PDF files',
  //   icon: 'i-heroicons-document',
  //   title: 'PDF Helper',
  // },
  TextTransformer: {
    category: 'Text',
    description:
      'Transform text into every case, Unicode style, and silly format at once.',
    icon: 'i-heroicons-language',
  },
  CharacterMap: {
    category: 'Text',
    description: 'Browse symbols, emojis, and special characters.',
    icon: 'i-heroicons-hashtag',
  },
  CronHelper: {
    category: 'Code',
    description: 'Helps setup cronjobs.',
    icon: 'i-heroicons-clock',
  },
  FlexboxGenerator: {
    category: 'Code',
    description: 'Learn and build Flexbox CSS.',
    icon: 'i-heroicons-squares-2x2',
  },
  NthChild: {
    category: 'Code',
    description: 'Define nth-child patterns',
    icon: 'i-heroicons-squares-plus',
    title: ':nth-child Helper',
  },
  IconSearch: {
    category: 'Code',
    description: 'Search for the ideal icon.',
    icon: 'i-lucide-shapes',
  },
  MinifyBeautify: {
    category: 'Code',
    description: 'Minify and format HTML, CSS, JS, and SVG files.',
    icon: 'i-heroicons-code-bracket',
  },
  RegexHelper: {
    category: 'Code',
    description: 'Write and debug regular expressions.',
    icon: 'i-heroicons-funnel',
  },
  // DataConverter: {
  //   category: 'Code',
  //   description: 'Convert between JSON, CSV, and YAML.',
  //   icon: 'i-heroicons-table-cells',
  // },
  UrlInspector: {
    category: 'Web',
    description: 'Check url for OpenGraph data',
    icon: 'i-heroicons-magnifying-glass',
  },
  UtmBuilder: {
    category: 'Web',
    description: 'Generate URLs for marketing campaigns.',
    icon: 'i-heroicons-link',
  },
  // FaviconGenerator: {
  //   category: 'Web',
  //   description: 'Generate a favicon pack from an image.',
  //   icon: 'i-heroicons-star',
  // },
  ImageResizer: {
    category: 'Design',
    description: 'Resize images in bulk!',
    icon: 'i-heroicons-photo',
  },
  // ImageFx: {
  //   category: 'Design',
  //   description: 'Add effects to images!',
  //   icon: 'i-heroicons-photo',
  // },
  // ShadowGenerator: {
  //   category: 'Design',
  //   description: 'Build and preview layered CSS box shadows.',
  //   icon: 'i-heroicons-squares-2x2',
  // },

  // GridGenerator: {
  //   category: 'Design',
  //   description: 'Helps create Grid layouts',
  //   icon: 'i-heroicons-squares-2x2',
  // },
  ColourPalette: {
    category: 'Design',
    description: 'Generates colour palettes.',
    icon: 'i-heroicons-swatch',
  },
  // PaperSizes: {
  //   category: 'Design',
  //   description:
  //     'Reference for A, B, C, and US paper sizes with unit conversion.',
  //   icon: 'i-heroicons-document',
  //   title: 'Paper Sizes',
  // },
  SvgOptimizer: {
    category: 'Design',
    description: 'Compress and clean up SVG files.',
    icon: 'i-heroicons-arrows-pointing-in',
  },
};

export function getSlug(file: string) {
  return file
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '');
}

export function getLabel(file: string, title?: string) {
  return title ?? file.replace(/([A-Z])/g, ' $1').trim();
}

const registry: Record<
  string,
  { label: string; file: string; description?: string; category: string }
> = {};
const groups: Record<string, ToolItem[]> = {};

for (const file of Object.keys(config).sort()) {
  const meta = config[file];

  const id = file
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '');

  const path = `/${id}`;

  if (meta) {
    const label = meta.title ?? file.replace(/([A-Z])/g, ' $1').trim();
    registry[path] = {
      label,
      file,
      description: meta.description,
      category: meta.category,
    };
    groups[meta.category] ??= [];
    groups[meta.category]?.push({ id, label, to: path, ...meta });
  }
}

const sortedGroups = order
  .filter((cat) => groups[cat])
  .reduce(
    (acc, cat) => {
      acc[cat] = groups[cat];
      return acc;
    },
    {} as Record<string, ToolItem[]>,
  );

export const useTools = () => ({
  registry,
  groups: sortedGroups,
  categories,
  colours,
});
