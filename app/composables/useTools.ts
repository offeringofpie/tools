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
  seoTitle?: string;
  seoDescription?: string;
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
  return (
    colorClasses[categories[category]?.color ?? 'primary'] ??
    colorClasses.primary!
  );
}

const order = ['General', 'Code', 'Design', 'Text', 'Web', 'Math', 'Other'];

export const config: Record<string, ToolConfig> = {
  WhatIsMyIp: {
    category: 'General',
    description: 'Your public IP and network info.',
    icon: 'i-heroicons-map-pin',
    title: 'What is my IP?',
    seoTitle: 'What Is My IP? Check Your Public IP Address',
    seoDescription:
      'See your public IP address at a glance, along with your ISP, city, country, and time zone.',
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
    seoTitle: 'Weather Forecast Map: 7-Day Local Forecast',
    seoDescription:
      'Check the 7-day weather forecast for anywhere in the world.',
  },
  UnitConverter: {
    category: 'Math',
    description:
      'Convert between units of length, weight, temperature, and more.',
    icon: 'i-heroicons-arrows-right-left',
    seoTitle: 'Unit Converter: Length, Weight, Temperature',
    seoDescription:
      'Convert between metric and imperial units for length, weight, temperature, speed, area, volume, pressure, digital storage, and number bases.',
  },
  TimeConverter: {
    category: 'Math',
    description: 'Convert time between different formats.',
    icon: 'i-heroicons-clock',
    seoTitle: 'Time Converter: Unix Timestamp & Time Zones',
    seoDescription:
      'Convert Unix epoch timestamps, ISO 8601 dates, and time zones in one place. Paste any value and read it back in every format.',
  },
  MarkdownEditor: {
    category: 'Text',
    description: 'A clean, distraction-free Markdown writing environment.',
    icon: 'i-heroicons-document-text',
    seoTitle: 'Markdown Editor with Live Preview',
    seoDescription:
      'A clean, distraction-free Markdown editor with live preview. Write, format, and copy your Markdown without anything leaving your browser.',
  },
  LoremIpsum: {
    category: 'Text',
    description:
      'Generate placeholder text in Lorem, Hipster, or Bacon flavors.',
    icon: 'i-heroicons-document-duplicate',
    seoTitle: 'Lorem Ipsum Generator: Placeholder Text',
    seoDescription:
      'Generate placeholder text in Lorem Ipsum, Hipster, or Bacon flavours.',
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
    seoTitle: 'Text Case Converter: camelCase, snake_case etc',
    seoDescription:
      'Paste text once and get every case at once: uppercase, title case, camelCase, PascalCase, snake_case, kebab-case, etc.',
  },
  CharacterMap: {
    category: 'Text',
    description: 'Browse symbols, emojis, and special characters.',
    icon: 'i-heroicons-hashtag',
    seoTitle: 'Character Map: Unicode Symbols and Emojis',
    seoDescription:
      'Search thousands of Unicode symbols, emojis, arrows, and accented characters.',
  },
  CronHelper: {
    category: 'Code',
    description: 'Build and decode cron schedules.',
    icon: 'i-heroicons-clock',
    seoTitle: 'Cron Expression Generator & Crontab Helper',
    seoDescription:
      'Build cron expressions and read them back in plain English.',
  },
  FlexboxGenerator: {
    category: 'Code',
    description: 'Learn and build Flexbox CSS.',
    icon: 'i-heroicons-squares-2x2',
    seoTitle: 'Flexbox Generator: Build CSS Flex Layouts',
    seoDescription: 'Build a Flexbox layout visually and copy the CSS.',
  },
  NthChild: {
    category: 'Code',
    description: 'Test and build :nth-child patterns.',
    icon: 'i-heroicons-squares-plus',
    title: ':nth-child Helper',
    seoTitle: 'CSS :nth-child Tester and Pattern Generator',
    seoDescription:
      'Work out exactly which elements a CSS :nth-child formula selects.',
  },
  IconSearch: {
    category: 'Code',
    description: 'Search for the ideal icon.',
    icon: 'i-lucide-shapes',
    seoTitle: 'Icon Search: Find Open-Source Icons',
    seoDescription:
      'Search thousands of open-source icons from popular icon sets in one place.',
  },
  MinifyBeautify: {
    category: 'Code',
    description: 'Minify and format HTML, CSS, JS, and SVG files.',
    icon: 'i-heroicons-code-bracket',
    seoTitle: 'Minify and Beautify HTML, CSS, JS & SVG',
    seoDescription:
      'Minify code to ship it smaller, or beautify it to read it. Works with HTML, CSS, JavaScript, and SVG.',
  },
  RegexHelper: {
    category: 'Code',
    description: 'Write and debug regular expressions.',
    icon: 'i-heroicons-funnel',
    seoTitle: 'Regex Tester: Write and Debug Regular Expressions',
    seoDescription:
      'Write a regular expression and test it against your own text.',
  },
  UrlInspector: {
    category: 'Web',
    description: 'Check a URL for OpenGraph and meta data.',
    icon: 'i-heroicons-magnifying-glass',
    seoTitle: 'URL Inspector: Check OpenGraph & Meta Tags',
    seoDescription:
      'Paste a URL to see its title, description, OpenGraph, and Twitter card tags, exactly as search engines and social networks read them.',
  },
  UtmBuilder: {
    category: 'Web',
    description: 'Generate URLs for marketing campaigns.',
    icon: 'i-heroicons-link',
    seoTitle: 'UTM Builder: Campaign URL Generator',
    seoDescription:
      'Build tagged campaign URLs for your marketing links. Fill in source, medium, and campaign, and copy a clean, correctly encoded UTM link.',
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
    seoTitle: 'Bulk Image Resizer: Resize Images Online',
    seoDescription:
      'Resize and crop images in bulk, with presets for common aspect ratios, then download them as a zip. Nothing is uploaded, it all runs in your browser.',
  },
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
    description: 'Generate and export colour palettes.',
    icon: 'i-heroicons-swatch',
    seoTitle: 'Colour Palette Generator: Build Colour Schemes',
    seoDescription:
      'Generate a colour palette with a keystroke, lock the colours you want to keep, and export the colour codes when done.',
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
    seoTitle: 'SVG Optimizer: Compress and Clean SVG Files',
    seoDescription:
      'Shrink SVG files by stripping out editor cruft, with a live preview and the optimized size before you commit.',
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
  {
    label: string;
    file: string;
    description?: string;
    category: string;
    seoTitle?: string;
    seoDescription?: string;
  }
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
      seoTitle: meta.seoTitle,
      seoDescription: meta.seoDescription,
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
