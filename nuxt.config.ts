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

  modules: [
    '@nuxt/a11y',
    '@nuxt/eslint',
    '@nuxt/scripts',
    '@nuxt/image',
    '@nuxt/ui',
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

  scripts: {
    registry: {
      googleTagManager: {
        id: process.env.GTM,
      },
    },
  },
});
