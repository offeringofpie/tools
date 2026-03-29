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

useHead({
  title: `${toolData.label} - JL Tools`,
});
</script>

<template>
  <div>
    <component :is="Tool" />
  </div>
</template>
