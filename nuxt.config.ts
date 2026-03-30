// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  ssr: true,
  nitro: {
    preset: 'netlify',
  },

  css: ['~/assets/css/main.css'],
  app: {
    baseURL: '/tools/',
  },
  devtools: { enabled: true },

  modules: [
    '@nuxt/a11y',
    '@nuxt/eslint',
    '@nuxt/scripts',
    '@nuxt/image',
    '@nuxt/ui',
  ],
});
