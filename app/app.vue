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
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Recursive:slnt,wght,CASL,CRSV,MONO@-15..0,300..1000,0..1,0..1,0..1&display=swap',
      media: 'print',
      onload: "this.media='all'",
    },
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
