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

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  ssr: true,
  nitro: {
    preset: 'netlify',
    prerender: {
      crawlLinks: true,
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
