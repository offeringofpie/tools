import type { NavigationMenuItem } from '@nuxt/ui';

export interface ToolItem extends NavigationMenuItem {
  id: string;
  description: string;
}

interface ToolConfig {
  category: string;
  icon: string;
  description: string;
}

const config: Record<string, ToolConfig> = {
  UnitConverter: {
    category: 'Math',
    icon: 'i-heroicons-arrows-right-left',
    description: 'Convert between units of length, weight, temperature, etc.',
  },
  TimeConverter: {
    category: 'Math',
    icon: 'i-heroicons-clock',
    description: 'Convert time between different formats.',
  },
  MarkdownEditor: {
    category: 'Text',
    icon: 'i-heroicons-document-text',
    description: 'A clean, distraction-free Markdown writing environment.',
  },
  // LoremIpsum: {
  //   category: 'Text',
  //   icon: 'i-heroicons-document-duplicate',
  //   description:
  //     'Generate placeholder text in Lorem, Hipster, or Bacon flavors.',
  // },
  // TextTransformer: {
  //   category: 'Text',
  //   icon: 'i-heroicons-language',
  //   description:
  //     'Transform text into every case, Unicode style, and silly format at once.',
  // },
  // CharacterMap: {
  //   category: 'Text',
  //   icon: 'i-heroicons-hashtag',
  //   description: 'Browse and search symbols, emoji, and special characters.',
  // },
  CronHelper: {
    category: 'Code',
    icon: 'i-heroicons-clock',
    description: 'Helps setup cronjobs.',
  },
  RegexHelper: {
    category: 'Code',
    icon: 'i-heroicons-funnel',
    description: 'Write and debug regular expressions.',
  },
  MinifyBeautify: {
    category: 'Code',
    icon: 'i-heroicons-code-bracket',
    description: 'Minify and format HTML, CSS, JS, and SVG files.',
  },
  UrlInspector: {
    category: 'Web',
    icon: 'i-heroicons-magnifying-glass',
    description: 'Check url for OpenGraph data',
  },
  UtmBuilder: {
    category: 'Web',
    icon: 'i-heroicons-link',
    description: 'Generate URLs for marketing campaigns.',
  },
  // FaviconGenerator: {
  //   category: 'Web',
  //   icon: 'i-heroicons-star',
  //   description: 'Generate a favicon pack from an image.',
  // },
  ImageResizer: {
    category: 'Design',
    icon: 'i-heroicons-photo',
    description: 'Resize images in bulk!',
  },
  ColourPalette: {
    category: 'Design',
    icon: 'i-heroicons-swatch',
    description: 'Generates colour palettes.',
  },
  SvgOptimizer: {
    category: 'Design',
    icon: 'i-heroicons-arrows-pointing-in',
    description: 'Compress and clean up SVG files.',
  },
};

export const useTools = () => {
  const registry: Record<string, { label: string; file: string }> = {};
  const groups: Record<string, ToolItem[]> = {};

  for (const file of Object.keys(config).sort()) {
    const meta = config[file];

    const id = file
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '');

    const label = file.replace(/([A-Z])/g, ' $1').trim();
    const path = `/${id}`;

    registry[path] = { label, file };

    groups[meta.category] ??= [];
    groups[meta.category]?.push({ id, label, to: path, ...meta });
  }

  const sortedGroups = Object.keys(groups)
    .sort()
    .reduce(
      (acc, cat) => {
        acc[cat] = groups[cat];
        return acc;
      },
      {} as Record<string, ToolItem[]>,
    );

  return { registry, groups: sortedGroups };
};
