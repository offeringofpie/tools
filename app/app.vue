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
      href: () => (route.path === '/' ? siteUrl : `${siteUrl}${route.path}`),
    },
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Recursive:slnt,wght,CASL,CRSV,MONO@-15..0,300..1000,0..1,0..1,0..1&display=swap',
      media: 'print',
      onload: "this.media='all'",
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
  ogImage: `${siteUrl}/img/jl-facebook.jpg`,
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
