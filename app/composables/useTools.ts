import type { NavigationMenuItem } from '@nuxt/ui';

export interface ToolItem extends NavigationMenuItem {
  id: string;
  description: string;
}

interface ToolConfig {
  category: string;
  icon: string;
  title?: string;
  description: string;
}

const toolConfig: Record<string, ToolConfig> = {
  UnitConverter: {
    category: 'Math',
    icon: 'i-heroicons-arrows-right-left',
    description: 'Convert between units of length, weight, temperature, etc.',
  },
  MinifyBeautify: {
    category: 'Code',
    icon: 'i-heroicons-arrow-left-end-on-rectangle',
    title: 'Minifier / Beautifier',
    description: 'Quick & dirty minifier / beautifier.',
  },
};

export const useTools = () => {
  const files = import.meta.glob('../components/global/*.vue', { eager: true });
  const registry: Record<
    string,
    { label: string; file: string; description: string }
  > = {};

  const groups = Object.keys(files).reduce(
    (acc, path) => {
      const file = path.split('/').pop()?.replace('.vue', '');
      if (!file || file === 'HelloWorld') return acc;

      const config = toolConfig[file];

      if (!config) {
        throw new Error(`${file} not found.`);
      }

      const id = file
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .replace(/^-/, '');
      const label = config.title ?? file.replace(/([A-Z])/g, ' $1').trim();
      const description = config.description;
      const to = `/${id}`;

      registry[to] = { label, file, description };

      if (!acc[config.category]) acc[config.category] = [];

      acc[config.category].push({
        id,
        label,
        to,
        icon: config.icon,
        description: config.description,
      });

      return acc;
    },
    {} as Record<string, ToolItem[]>,
  );

  return { groups, registry };
};
