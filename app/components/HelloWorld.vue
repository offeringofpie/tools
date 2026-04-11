<script setup lang="ts">
const { groups } = useTools();
</script>

<template>
  <div class="space-y-12 pb-12">
    <section class="text-center max-w-2xl mx-auto space-y-4 pt-8">
      <h1 class="text-4xl md:text-5xl font-bold tracking-tight text-white">
        Welcome!
      </h1>
      <p class="text-lg text-base-400">
        This is a growing collection of handy open-source utilities, designed to
        make daily tasks a little bit easier.
      </p>
    </section>

    <section
      v-for="(tools, category) in groups"
      :key="category"
      :aria-labelledby="`category-${category}`"
      class="space-y-6"
    >
      <div class="space-y-2">
        <h2
          :id="`category-${category}`"
          class="text-sm font-semibold text-primary-500 uppercase tracking-widest px-1"
        >
          {{ category }}
        </h2>
        <USeparator />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ULink
          v-for="tool in tools"
          :key="tool.id"
          :to="tool.to"
          :aria-label="`${tool.label} – ${tool.description}`"
          class="block group rounded-xl"
        >
          <UCard
            class="h-full ring-1 ring-transparent group-hover:ring-primary-500 transition-colors"
          >
            <div class="flex items-start gap-4">
              <div
                class="shrink-0 size-10 rounded-lg bg-primary-500/10 flex items-center justify-center"
              >
                <UIcon
                  :name="tool.icon"
                  class="size-5 text-primary-400 group-hover:text-primary-300 transition-colors"
                />
              </div>
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
