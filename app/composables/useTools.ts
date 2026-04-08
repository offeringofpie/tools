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
  MinifyBeautify: {
    category: 'Code',
    icon: 'i-heroicons-code-bracket',
    description: 'Minify and format HTML, CSS, JS, and SVG files.',
  },
};

export const useTools = () => {
  const files = import.meta.glob('../components/global/*.vue', { eager: true });
  const registry: Record<string, { label: string; file: string }> = {};

  const rawGroups = Object.keys(files).reduce(
    (acc, path) => {
      const file = path.split('/').pop()?.replace('.vue', '');
      if (!file || file === 'HelloWorld') return acc;

      const meta = config[file];
      if (!meta) throw new Error(`Missing config for tool: ${file}`);

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
