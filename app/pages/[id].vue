<script setup lang="ts">
import { useTools } from '~/composables/useTools';

definePageMeta({
  validate: (route) => {
    return Boolean(useTools().registry[route.path]);
  },
});

const route = useRoute();
const { registry } = useTools();

const toolData = registry[route.path];

if (!toolData)
  throw createError({ statusCode: 404, statusMessage: 'Tool not found' });

// https://nuxt.com/docs/4.x/directory-structure/app/components#dynamic-imports
const Tool = resolveComponent(`Lazy${toolData.file}`);
</script>

<template>
  <div>
    <component :is="Tool" />
  </div>
</template>
