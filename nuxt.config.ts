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
