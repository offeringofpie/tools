<script setup lang="ts">
const route = useRoute();
const { registry } = useTools();

const toolData = registry[route.path];

if (!toolData) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Tool not found',
  });
}
// https://nuxt.com/docs/4.x/directory-structure/app/components#dynamic-imports
const Tool = resolveComponent(`Lazy${toolData.file}`);

useSeoMeta({
  title: toolData.label,
  description: `${toolData.description} | J Lopes`,
  ogTitle: toolData.label,
  ogDescription: `${toolData.description} | J Lopes`,
});
</script>

<template>
  <div>
    <component :is="Tool" />
  </div>
</template>
