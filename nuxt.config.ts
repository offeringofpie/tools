// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  ssr: true,
  nitro: {
    preset: 'netlify',
    prerender: {
      crawlLinks: true,
      routes: ['/'],
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
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://jlopes.eu/tools/',
      // owmKey: process.env.OWM_KEY,
    },
  },

  css: ['~/assets/css/main.css'],
  app: {
    baseURL: '/tools/',
  },
  site: {
    url: 'https://jlopes.eu',
    name: 'JL Tools',
  },

  experimental: { viewTransition: true },
  modules: [
    '@nuxt/a11y',
    '@nuxt/eslint',
    '@nuxt/scripts',
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxtjs/sitemap',
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

  sitemap: {
    urls: [
      '/character-map',
      '/colour-palette',
      '/cron-helper',
      '/decision-roulette',
      '/flexbox-generator',
      '/icon-search',
      '/image-resizer',
      '/lorem-ipsum',
      '/markdown-editor',
      '/minify-beautify',
      '/nth-child',
      '/regex-helper',
      '/svg-optimizer',
      '/text-transformer',
      '/time-converter',
      '/unit-converter',
      '/url-inspector',
      '/utm-builder',
      '/weather',
      '/what-is-my-ip',
    ],
  },

  scripts: {
    registry: {
      googleTagManager: {
        id: process.env.GTM,
      },
    },
  },
});
