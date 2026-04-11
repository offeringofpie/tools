<script setup lang="ts">
const route = useRoute();
const { registry } = useTools();

const toolData =
  registry[route.path] ?? registry[route.path.replace('/tools', '')];

if (!toolData)
  throw createError({ statusCode: 404, statusMessage: 'Tool not found' });

if (!toolData) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Tool not found',
  });
}
// https://nuxt.com/docs/4.x/directory-structure/app/components#dynamic-imports
const Tool = resolveComponent(`Lazy${toolData.file}`);

useSeoMeta({
  title: `${toolData.label} - JL Tools`,
  ogTitle: `${toolData.label} - JL Tools`,
  description: toolData.description,
  ogDescription: toolData.description,
});
</script>

<template>
  <div>
    <component :is="Tool" />
  </div>
</template>
