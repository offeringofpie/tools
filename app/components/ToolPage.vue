<script setup lang="ts">
type Props = {
  title?: string;
  description?: string;
};

const props = defineProps<Props>();

const route = useRoute();
const { registry } = useTools();

const tool = computed(() => registry[route.path]);
const heading = computed(() => props.title ?? tool.value?.label);
const summary = computed(() => props.description ?? tool.value?.description);
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div class="space-y-1">
        <h1 id="tool-title" class="text-title font-bold text-highlighted text-balance">
          {{ heading }}
        </h1>
        <div class="text-muted text-pretty">
          <slot name="description">{{ summary }}</slot>
        </div>
      </div>

      <div v-if="$slots.actions" class="flex flex-wrap items-center gap-3">
        <slot name="actions" />
      </div>
    </div>

    <slot />
  </div>
</template>
