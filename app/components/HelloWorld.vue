<script setup lang="ts">
const { groups, colours } = useTools();
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

const byPath = Object.fromEntries(
  Object.values(groups)
    .flat()
    .map((tool) => [tool.to as string, tool]),
);

const collections = [
  {
    value: 'marketing',
    label: 'Marketing',
    icon: 'i-heroicons-megaphone',
    tools: [
      '/utm-builder',
      '/url-inspector',
      '/markdown-editor',
      '/colour-palette',
      '/image-resizer',
      '/text-transformer',
    ],
  },
  {
    value: 'developers',
    label: 'Developers',
    icon: 'i-heroicons-command-line',
    tools: [
      '/regex-helper',
      '/cron-helper',
      '/minify-beautify',
      '/flexbox-generator',
      '/nth-child',
      '/icon-search',
    ],
  },
  {
    value: 'business',
    label: 'Business',
    icon: 'i-heroicons-briefcase',
    tools: [
      '/unit-converter',
      '/time-converter',
      '/markdown-editor',
      '/lorem-ipsum',
      '/weather',
      '/what-is-my-ip',
    ],
  },
  {
    value: 'designers',
    label: 'Designers',
    icon: 'i-heroicons-paint-brush',
    tools: [
      '/colour-palette',
      '/icon-search',
      '/character-map',
      '/svg-optimizer',
      '/flexbox-generator',
      '/lorem-ipsum',
    ],
  },
];

const active = ref('marketing');

const toolsFor = (value: string) => {
  const collection = collections.find((c) => c.value === value);
  return (collection?.tools ?? []).flatMap((path) => {
    const tool = byPath[path];
    return tool ? [tool] : [];
  });
};
</script>

<template>
  <div class="space-y-8 pb-12 flex flex-col">
    <header class="text-center max-w-2xl self-center mb-16">
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
      aria-labelledby="find-tools"
      class="space-y-6 border-b border-base-800 pb-10"
    >
      <div class="flex items-center gap-3">
        <div>
          <h2
            id="find-tools"
            class="text-2xl font-bold text-white text-balance"
          >
            The right tools for you
          </h2>
          <p class="text-base-400 text-pretty">
            Here's some suggestions based on workflow.
          </p>
        </div>
      </div>

      <UTabs
        v-model="active"
        :items="collections"
        color="primary"
        aria-label="Filter tools by workflow"
        class="w-full"
      >
        <template #content="{ item }">
          <UPageGrid :ui="{ base: 'gap-x-6 gap-y-4 pt-2' }">
            <UPageFeature
              v-for="tool in toolsFor(item.value)"
              :key="tool.id"
              :icon="tool.icon"
              :title="tool.label"
              :description="tool.description"
              :to="tool.to"
              orientation="horizontal"
              :ui="{
                root: [
                  'group p-4 rounded-lg ring ring-default bg-base-800 hover:bg-base-700',
                  'transition-all duration-200 hover:shadow-lg hover:ring-primary',
                ],
                leadingIcon:
                  'transition-transform duration-200 group-hover:scale-110 text-primary',
                title: 'transition-colors group-hover:text-primary text-white',
              }"
            />
          </UPageGrid>
        </template>
      </UTabs>
    </section>

    <section
      v-for="(tools, category) in groups"
      :key="category"
      :aria-labelledby="`cat-${slug(category)}`"
      class="space-y-4"
    >
      <h2
        :class="[
          'text font-semibold uppercase tracking-widest',
          colours(category).text,
        ]"
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
              'group p-4 rounded-lg ring ring-default bg-base-800 hover:bg-base-700',
              'transition-all duration-200 hover:shadow-lg',
              colours(category).hoverRing,
            ],
            leadingIcon: `transition-transform duration-200 group-hover:scale-110 ${colours(category).text}`,
            title: `transition-colors ${colours(category).groupHoverText} ${colours(category).text}`,
          }"
        />
      </UPageGrid>
    </section>
  </div>
</template>
