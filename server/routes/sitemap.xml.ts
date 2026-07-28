import { config, getSlug } from '~/composables/useTools';

export default defineEventHandler((event) => {
  const { siteUrl } = useRuntimeConfig(event).public;
  const base = siteUrl.replace(/\/$/, '');

  const urls = [
    `${base}/`,
    ...Object.keys(config).map((file) => `${base}/${getSlug(file)}`),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((loc) => `  <url><loc>${loc}</loc></url>`).join('\n')}
</urlset>
`;

  setResponseHeader(event, 'content-type', 'application/xml; charset=utf-8');
  return body;
});
