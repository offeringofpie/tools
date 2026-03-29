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

const toolConfig: Record<string, ToolConfig> = {
  UnitConverter: {
    category: 'Math',
    icon: 'i-heroicons-arrows-right-left',
    description: 'Convert between units of length, weight, temperature, etc.',
  },
};

export const useTools = () => {
  const files = import.meta.glob('~/components/global/*.vue', { eager: true });

  const registry: Record<string, { label: string; file: string }> = {};

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
      const label = file.replace(/([A-Z])/g, ' $1').trim();
      const to = `/${id}`;

      registry[to] = { label, file };

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
