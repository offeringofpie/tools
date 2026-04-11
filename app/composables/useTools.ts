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
  // LoremIpsum: {
  //   category: 'Text',
  //   description:
  //   icon: 'i-heroicons-document-duplicate',
  //     'Generate placeholder text in Lorem, Hipster, or Bacon flavors.',
  // },
  // TextTransformer: {
  //   category: 'Text',
  //   description:
  //   icon: 'i-heroicons-language',
  //     'Transform text into every case, Unicode style, and silly format at once.',
  // },
  // CharacterMap: {
  //   category: 'Text',
  //   description: 'Browse and search symbols, emoji, and special characters.',
  //   icon: 'i-heroicons-hashtag',
  // },
  CronHelper: {
    category: 'Code',
    description: 'Helps setup cronjobs.',
    icon: 'i-heroicons-clock',
  },
  RegexHelper: {
    category: 'Code',
    description: 'Write and debug regular expressions.',
    icon: 'i-heroicons-funnel',
  },
  MinifyBeautify: {
    category: 'Code',
    description: 'Minify and format HTML, CSS, JS, and SVG files.',
    icon: 'i-heroicons-code-bracket',
  },
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
  ColourPalette: {
    category: 'Design',
    description: 'Generates colour palettes.',
    icon: 'i-heroicons-swatch',
  },
  SvgOptimizer: {
    category: 'Design',
    description: 'Compress and clean up SVG files.',
    icon: 'i-heroicons-arrows-pointing-in',
  },
};

export const useTools = () => {
  const registry: Record<
    string,
    { label: string; file: string; description?: string }
  > = {};
  const groups: Record<string, ToolItem[]> = {};

  for (const file of Object.keys(config).sort()) {
    const meta = config[file];

    const id = file
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '');

    const label = file.replace(/([A-Z])/g, ' $1').trim();
    const path = `/${id}`;

    registry[path] = { label, file, description: meta.description };
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
