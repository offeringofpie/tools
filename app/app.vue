<script setup lang="ts">
const route = useRoute();
const config = useRuntimeConfig();

useHead({
  htmlAttrs: {
    lang: 'en',
  },
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} - J Lopes` : 'J Lopes';
  },
  link: [
    { rel: 'canonical', href: () => `${config.public.siteUrl}${route.path}` },
  ],
});

useSeoMeta({
  description:
    'A collection of useful open-source utilities, designed to make daily tasks a little bit easier.',
  ogType: 'website',
  ogSiteName: 'J Lopes',
  ogTitle: 'J Lopes',
  ogDescription:
    'A collection of useful open-source utilities, designed to make daily tasks a little bit easier.',
  ogImage: `${config.public.siteUrl}/img/jl-facebook.jpg`,
  twitterCard: 'summary_large_image',
});
</script>

<template>
  <UApp class="min-h-screen">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
