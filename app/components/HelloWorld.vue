<script setup lang="ts">
const { groups } = useTools();
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
</script>

<template>
  <div class="space-y-8 pb-12 flex flex-col">
    <header class="text-center max-w-2xl self-center mb-24">
      <div
        class="mb-4 justify-center font-semibold text-primary flex items-center gap-1.5"
      >
        Welcome!
      </div>
      <h1
        data-slot="title"
        class="text-5xl sm:text-7xl text-pretty tracking-tight font-bold text-highlighted"
      >
        JL's tools
      </h1>
      <div
        data-slot="description"
        class="text-lg sm:text-xl/8 text-muted text-balance mt-6"
      >
        This is a growing collection of open-source tools, designed to make your
        daily tasks a little bit easier.
      </div>
    </header>

    <section
      v-for="(tools, category) in groups"
      :key="category"
      :aria-labelledby="`cat-${slug(category)}`"
      class="space-y-4"
    >
      <h2
        :id="`cat-${slug(category)}`"
        class="text font-semibold uppercase tracking-widest text-primary"
      >
        {{ category }}
      </h2>
      <UPageGrid :ui="{ base: 'gap-x-6 gap-y-4' }">
        <UPageFeature
          v-for="tool in tools"
          :key="tool.id"
          :icon="tool.icon"
          :title="tool.label"
          :description="tool.description"
          :to="tool.to"
          orientation="horizontal"
          :ui="{
            root: [
              'group p-4 rounded-lg ring ring-default bg-default',
              'transition-all duration-200',
              'hover:ring-primary hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5',
            ],
            leadingIcon:
              'transition-transform duration-200 group-hover:scale-110',
            title: 'transition-colors group-hover:text-primary',
          }"
        />
      </UPageGrid>
    </section>
  </div>
</template>
