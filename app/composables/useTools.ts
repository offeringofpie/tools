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

  const rawGroups = Object.entries(config).reduce(
    (acc, [file, meta]) => {
      const id = file
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .replace(/^-/, '');
      const label = file.replace(/([A-Z])/g, ' $1').trim();
      const to = `/${id}`;

      registry[to] = { label, file };

      acc[meta.category] ??= [];
      acc[meta.category].push({ id, label, to, ...meta });

      return acc;
    },
    {} as Record<string, ToolItem[]>,
  );

  const groups = Object.keys(rawGroups)
    .sort((a, b) => a.localeCompare(b))
    .reduce(
      (acc, category) => {
        acc[category] = rawGroups[category].sort((a, b) =>
          (a.label as string).localeCompare(b.label as string),
        );
        return acc;
      },
      {} as Record<string, ToolItem[]>,
    );

  return { registry, groups };
};
