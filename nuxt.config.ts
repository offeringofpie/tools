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
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://jlopes.eu/',
    },
  },

  css: ['~/assets/css/main.css'],
  app: {
    baseURL: '/tools/',
  },
  site: {
    url: 'https://jlopes.eu/tools',
    name: 'JL Tools',
  },

  modules: [
    '@nuxt/a11y',
    '@nuxt/eslint',
    '@nuxt/scripts',
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxtjs/sitemap',
    '@nuxtjs/robots',
  ],

  devtools: { enabled: true },
  vite: {
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        '@vueuse/core',
        '@tiptap/vue-3',
        '@tiptap/starter-kit',
        'tiptap-markdown',
        'marked',
        'node-html-parser',
      ],
    },
  },

  sitemap: {
    urls: [
      '/unit-converter',
      '/time-converter',
      '/markdown-editor',
      '/cron-helper',
      '/regex-helper',
      '/minify-beautify',
      '/url-inspector',
      '/utm-builder',
      '/image-resizer',
      '/colour-palette',
      '/svg-optimizer',
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
