<script setup lang="ts">
const route = useRoute();
const config = useRuntimeConfig();
const siteUrl = config.public.siteUrl.replace(/\/$/, '');
const description =
  'A collection of useful open-source utilities, designed to make daily tasks a little bit easier.';

useHead({
  htmlAttrs: {
    lang: 'en',
  },
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} - J Lopes` : 'J Lopes';
  },
  link: [
    {
      rel: 'canonical',
      href: () => {
        return route.path === '/' ? `${siteUrl}/` : `${siteUrl}${route.path}`;
      },
    },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'JL Tools',
        url: siteUrl,
        description,
      }),
    },
  ],
});

useSeoMeta({
  description,
  ogType: 'website',
  ogSiteName: 'J Lopes',
  ogTitle: 'J Lopes',
  ogDescription: description,
  ogImage: 'https://jlopes.eu/img/jl-facebook.jpg',
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
