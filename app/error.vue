<script setup lang="ts">
import type { NuxtError } from '#app';

const props = defineProps<{ error: NuxtError }>();

const isNotFound = computed(() => props.error.statusCode === 404);

const heading = computed(() =>
  isNotFound.value ? 'Tool not found' : 'Something went wrong',
);

const message = computed(() => {
  if (isNotFound.value) {
    return "This tool doesn't exist or has moved. Pick another from the list.";
  }
  return props.error.message || 'An unexpected error occurred.';
});

useHead({ title: heading.value });

function goHome() {
  clearError({ redirect: '/' });
}
</script>

<template>
  <UApp>
    <div
      class="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center bg-default text-base-50"
    >
      <SiteLogo class="size-16 text-primary" />

      <p class="text-7xl font-bold text-primary tabular-nums">
        {{ error.statusCode }}
      </p>

      <div class="space-y-2 max-w-md">
        <h1 class="text-2xl md:text-3xl font-bold text-white">
          {{ heading }}
        </h1>
        <p class="text-base-400">{{ message }}</p>
      </div>

      <UButton
        size="lg"
        color="primary"
        icon="i-heroicons-arrow-left"
        @click="goHome"
      >
        Back to tools
      </UButton>
    </div>
  </UApp>
</template>
