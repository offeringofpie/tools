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

const Tool = resolveComponent(toolData.file);

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
