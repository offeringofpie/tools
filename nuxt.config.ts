import { rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

// Runs before Google Tag Manager loads, so Google's tags start denied for
// everything except analytics. Analytics is granted with client storage
// switched off in the container, which keeps it cookieless.
const consentDefaults = `
window.dataLayer = window.dataLayer || [];
function gtag() { window.dataLayer.push(arguments); }
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'granted',
  functionality_storage: 'denied',
  personalization_storage: 'denied',
  security_storage: 'granted',
});
gtag('set', 'url_passthrough', true);
gtag('set', 'ads_data_redaction', true);
`;

// Workers static assets only read these from the root of the assets
// directory, while Nitro writes `_headers` inside the `/tools/` base.
const redirects = `/tools /tools/ 301
/tools/index.html /tools/ 301
/tools/:slug/ /tools/:slug 301
`;

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  ssr: true,
  nitro: {
    preset: 'cloudflare_module',
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
      wrangler: {
        name: 'jl-tools',
      },
    },
    prerender: {
      crawlLinks: true,
      autoSubfolderIndex: false,
      routes: ['/', '/sitemap.xml'],
    },
    storage: {
      'rate-limit': {
        driver: 'memory',
      },
      cache: {
        driver: 'memory',
      },
    },
  },

  hooks: {
    'nitro:init'(nitro) {
      if (nitro.options.dev) {
        return;
      }

      nitro.hooks.hook('compiled', async () => {
        const assetsDir = join(nitro.options.output.dir, 'public');
        await rename(
          join(nitro.options.output.publicDir, '_headers'),
          join(assetsDir, '_headers'),
        );
        await writeFile(join(assetsDir, '_redirects'), redirects);
      });
    },
  },

  runtimeConfig: {
    owmKey: process.env.OWM_KEY,
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://jlopes.eu/tools',
      // owmKey: process.env.OWM_KEY,
    },
  },

  css: ['~/assets/css/main.css'],
  app: {
    baseURL: '/tools/',
    head: {
      script: process.env.GTM
        ? [
            {
              tagPriority: -1,
              innerHTML: consentDefaults,
            },
          ]
        : [],
    },
  },
  site: {
    url: 'https://jlopes.eu',
    name: 'JL Tools',
  },

  fonts: {
    families: [
      {
        name: 'Recursive Variable',
        src: 'https://fonts.gstatic.com/s/recursive/v44/8vIz7wMr0mhh-RQChyHEH06TlXhq_gukbYrFMk1QuAIcyEwG_X-dpEfaE61aHWiJ-CImKsvbsWd9qtZleg.woff2',
        weight: '300 1000',
        display: 'swap',
        fallbacks: ['system-ui', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    ],
  },

  experimental: { viewTransition: true },
  sourcemap: { server: false },
  icon: {
    serverBundle: {
      collections: ['heroicons', 'lucide'],
    },
  },
  modules: [
    '@nuxt/a11y',
    '@nuxt/eslint',
    '@nuxt/scripts',
    '@nuxt/ui',
    '@nuxtjs/robots',
  ],

  devtools: { enabled: process.env.NODE_ENV === 'development' },
  vite: {
    optimizeDeps: {
      include: [
        '@tiptap/starter-kit',
        '@tiptap/vue-3',
        '@vueuse/core',
        'cronstrue',
        'jszip',
        'marked',
        'node-html-parser',
        'svgo/browser',
        'tiptap-markdown',
      ],
    },
  },

  // Served under /tools/; the parent site owns the domain-root robots.txt.
  robots: {
    robotsTxt: false,
  },

  scripts: {
    registry: {
      googleTagManager: {
        id: process.env.GTM,
      },
    },
  },
});
