import { config, getSlug } from '~/composables/useTools';

const baseUrl = 'https://jlopes.eu/tools';

export default defineSitemapEventHandler(() => {
  return [
    { loc: `${baseUrl}/` },
    ...Object.keys(config).map((file) => ({
      loc: `${baseUrl}/${getSlug(file)}`,
    })),
  ];
});
