import { defineVitestConfig } from '@nuxt/test-utils/config';

export default defineVitestConfig({
  test: {
    environment: 'nuxt',

    environmentOptions: {
      nuxt: {
        domEnvironment: 'happy-dom',
      },
    },

    include: ['app/**/*.spec.ts', 'app/**/*.test.ts'],
    globals: true,
  },
});
