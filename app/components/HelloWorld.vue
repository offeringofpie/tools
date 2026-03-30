<script setup lang="ts">
const { groups } = useTools();
</script>

<template>
  <div class="space-y-12 pb-12">
    <section class="text-center max-w-2xl mx-auto space-y-4 pt-8">
      <h1 class="text-4xl md:text-5xl font-bold tracking-tight text-white">
        Welcome!
      </h1>
      <p class="text-lg text-gray-400">
        A collection of useful open-source utilities, designed to make daily
        tasks a little bit easier.
      </p>
    </section>

    <section
      v-for="(tools, category) in groups"
      :key="category"
      class="space-y-6"
    >
      <div class="space-y-2">
        <h2
          class="text-sm font-semibold text-primary-500 uppercase tracking-widest px-1"
        >
          {{ category }}
        </h2>
        <USeparator :ui="{ border: { base: 'border-base-800' } }" />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ULink
          v-for="tool in tools"
          :key="tool.id"
          :to="tool.to"
          :aria-label="`${tool.label} – ${tool.description}`"
          class="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-xl"
        >
          <UCard
            class="h-full transition-all duration-200 bg-background hover:bg-background"
          >
            <div class="flex items-start gap-4">
              <UAvatar
                :icon="`${tool.icon}`"
                size="md"
                color="primary"
                variant="soft"
                class="shrink-0"
              />

              <div>
                <h3
                  class="text-base font-medium group-hover:text-primary transition-colors"
                >
                  {{ tool.label }}
                </h3>
                <p
                  class="text-base-500 text-sm mt-1 leading-relaxed line-clamp-2"
                >
                  {{ tool.description }}
                </p>
              </div>
            </div>
          </UCard>
        </ULink>
      </div>
    </section>
  </div>
</template>
