import {
  type ToolConfig,
  config,
  getSlug,
  getLabel,
} from '~/composables/useTools';

const BASE_URL = 'https://jlopes.eu';

export default defineEventHandler(() => {
  return Object.keys(config).map((file) => {
    const meta: ToolConfig | undefined = config[file];
    const slug = getSlug(file);
    const label = getLabel(file);

    return {
      id: `tool:${slug}`,
      url: `${BASE_URL}/${slug}`,
      slug: `tools/${slug}`,
      category: 'tool',
      body: meta?.description,
      data: {
        title: label,
        description: meta?.description,
        tags: [meta?.category.toLowerCase(), 'tool'],
      },
    };
  });
});
