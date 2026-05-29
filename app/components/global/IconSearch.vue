<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import {
  refDebounced,
  useBreakpoints,
  breakpointsTailwind,
} from '@vueuse/core';
import { useVirtualizer } from '@tanstack/vue-virtual';

interface IconEntry {
  id: string;
  name: string;
  lib: string;
  tags: string[];
  body: string;
  w: number;
  h: number;
}

const maxResults = 2000;

const libLabels: Record<string, string> = {
  heroicons: 'Heroicons',
  lucide: 'Lucide',
  ph: 'Phosphor',
  solar: 'Solar',
  fa6: 'Font Awesome 6',
  carbon: 'Carbon',
  'simple-icons': 'Simple Icons',
};

const featuredIds = [
  'heroicons:home',
  'heroicons:user',
  'heroicons:cog-6-tooth',
  'heroicons:magnifying-glass',
  'heroicons:heart',
  'heroicons:star',
  'heroicons:bell',
  'heroicons:envelope',
  'heroicons:check-circle',
  'heroicons:x-circle',
  'heroicons:arrow-right',
  'heroicons:plus',
  'lucide:github',
  'lucide:settings',
  'lucide:trash-2',
  'lucide:edit',
  'lucide:download',
  'lucide:upload',
  'lucide:copy',
  'lucide:link',
  'lucide:search',
  'lucide:menu',
  'lucide:moon',
  'lucide:sun',
];

const stripSuffix = (name: string, suffixes: string[]) => {
  for (const suffix of suffixes)
    if (name.endsWith(`-${suffix}`)) return name.slice(0, -(suffix.length + 1));
  return name;
};

const heroBaseName = (name: string) =>
  stripSuffix(name, ['16-solid', '20-solid', 'solid']);
const phBaseName = (name: string) =>
  stripSuffix(name, ['bold', 'duotone', 'fill', 'light', 'thin']);
const solarBaseName = (name: string) =>
  stripSuffix(name, ['linear', 'outline', 'bold', 'broken', 'duotone']);

type RawIconSet = {
  icons: Record<string, { body: string; width?: number; height?: number }>;
};

function processSet(
  set: RawIconSet,
  lib: string,
  prefix: string,
  baseName: (name: string) => string,
  tags: Record<string, string[]> = {},
  defaultW = 24,
  defaultH = 24,
): IconEntry[] {
  return Object.entries(set.icons).map(([name, icon]) => ({
    id: `${prefix}:${name}`,
    name: baseName(name),
    lib,
    tags: tags[name] ?? [],
    body: icon.body,
    w: icon.width ?? defaultW,
    h: icon.height ?? defaultH,
  }));
}

const allIcons = ref<IconEntry[]>([]);
const iconsLoaded = ref(false);

onMounted(async () => {
  const [
    { icons: heroiconsSet },
    { icons: lucideSet },
    { icons: phSet },
    { icons: solarSet },
    { icons: fa6SolidSet },
    { icons: fa6RegularSet },
    { icons: fa6BrandsSet },
    { icons: carbonSet },
    { icons: simpleIconsSet },
    lucideTagsMod,
  ] = await Promise.all([
    import('@iconify-json/heroicons'),
    import('@iconify-json/lucide'),
    import('@iconify-json/ph'),
    import('@iconify-json/solar'),
    import('@iconify-json/fa6-solid'),
    import('@iconify-json/fa6-regular'),
    import('@iconify-json/fa6-brands'),
    import('@iconify-json/carbon'),
    import('@iconify-json/simple-icons'),
    import('lucide-static/tags.json'),
  ]);

  const lucideTags = lucideTagsMod.default as Record<string, string[]>;

  allIcons.value = [
    ...processSet(heroiconsSet, 'heroicons', 'heroicons', heroBaseName),
    ...processSet(lucideSet, 'lucide', 'lucide', (n) => n, lucideTags),
    ...processSet(phSet, 'ph', 'ph', phBaseName, {}, 256, 256),
    ...processSet(solarSet, 'solar', 'solar', solarBaseName),
    ...processSet(fa6SolidSet, 'fa6', 'fa6-solid', (n) => n, {}, 512, 512),
    ...processSet(fa6RegularSet, 'fa6', 'fa6-regular', (n) => n, {}, 512, 512),
    ...processSet(fa6BrandsSet, 'fa6', 'fa6-brands', (n) => n, {}, 512, 512),
    ...processSet(carbonSet, 'carbon', 'carbon', (n) => n, {}, 32, 32),
    ...processSet(simpleIconsSet, 'simple-icons', 'simple-icons', (n) => n),
  ];
  iconsLoaded.value = true;
});

const iconById = computed(
  () => new Map(allIcons.value.map((icon) => [icon.id, icon])),
);

const makeSvg = (icon: IconEntry, size?: number) => {
  const sizeAttrs = size ? ` width="${size}" height="${size}"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${icon.w} ${icon.h}"${sizeAttrs} fill="currentColor">${icon.body}</svg>`;
};

const iconClass = (icon: IconEntry) => `i-${icon.id.replace(':', '-')}`;

const libCounts = computed(() =>
  allIcons.value.reduce<Record<string, number>>((acc, icon) => {
    acc[icon.lib] = (acc[icon.lib] ?? 0) + 1;
    return acc;
  }, {}),
);

const allLibs = computed(() =>
  Object.entries(libLabels).map(([key, label]) => {
    const count = libCounts.value[key];
    return {
      key,
      label: count ? `${label} (${count.toLocaleString()})` : label,
    };
  }),
);

const query = ref('');
const search = refDebounced(query, 150);
const filterLibs = ref<string[]>([]);
const copied = ref<string | null>(null);
const grid = ref<HTMLElement | null>(null);
const announcement = ref('');
const selectedIcon = ref<IconEntry | null>(null);
const modalOpen = ref(false);

const hasFilters = computed(() => search.value || filterLibs.value.length);

const openIcon = (icon: IconEntry) => {
  selectedIcon.value = icon;
  copied.value = null;
  modalOpen.value = true;
};

const toggleLib = (key: string) => {
  filterLibs.value = filterLibs.value.includes(key)
    ? filterLibs.value.filter((lib) => lib !== key)
    : [...filterLibs.value, key];
};

const copy = async (text: string, key: string, label: string) => {
  try {
    await navigator.clipboard.writeText(text);
    copied.value = key;
    announcement.value = `Copied ${label}`;
    setTimeout(() => {
      copied.value = null;
      announcement.value = '';
    }, 1500);
  } catch {}
};

const filteredIcons = computed(() => {
  let icons = filterLibs.value.length
    ? allIcons.value.filter((icon) => filterLibs.value.includes(icon.lib))
    : allIcons.value;

  const term = search.value.trim().toLowerCase();
  if (term)
    icons = icons.filter(
      (icon) =>
        icon.name.includes(term) ||
        icon.id.includes(term) ||
        icon.tags.some((t) => t.includes(term)) ||
        icon.lib.includes(term),
    );

  return icons.slice(0, maxResults);
});

const featuredIcons = computed(
  () =>
    featuredIds
      .map((id) => iconById.value.get(id))
      .filter(Boolean) as IconEntry[],
);

const breakpoints = useBreakpoints(breakpointsTailwind);
const cols = computed(() => (breakpoints.greaterOrEqual('lg').value ? 12 : 4));

const rows = computed(() => {
  const result: IconEntry[][] = [];
  for (let i = 0; i < filteredIcons.value.length; i += cols.value)
    result.push(filteredIcons.value.slice(i, i + cols.value));
  return result;
});

const rowVirtualizer = useVirtualizer(
  computed(() => ({
    count: rows.value.length,
    getScrollElement: () => grid.value,
    estimateSize: () => 88,
    overscan: 4,
    gap: 8,
  })),
);

const tileClass =
  'flex flex-col items-center rounded-lg border border-transparent bg-elevated hover:bg-accented hover:border-default transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';
</script>

<template>
  <div class="space-y-4 pb-12">
    <div aria-live="polite" aria-atomic="true" class="sr-only">
      {{ announcement }}
    </div>

    <header class="space-y-2">
      <h1 class="text-2xl md:text-3xl font-bold text-white">Icon Search</h1>
      <p class="text-base-400">Search for the ideal icon.</p>
    </header>

    <div class="flex gap-2 items-center">
      <UInput
        v-model="query"
        placeholder="Search name, keyword, library…"
        icon="i-heroicons-magnifying-glass"
        variant="subtle"
        size="lg"
        class="flex-1 font-mono"
        aria-label="Search icons"
      >
        <template v-if="query" #trailing>
          <UButton
            icon="i-heroicons-x-mark"
            variant="ghost"
            color="neutral"
            size="xs"
            aria-label="Clear search"
            @click="query = ''"
          />
        </template>
      </UInput>

      <UPopover :ui="{ content: 'w-72 p-3 space-y-3' }">
        <UButton
          variant="subtle"
          size="lg"
          :color="filterLibs.length ? 'primary' : 'neutral'"
          trailing-icon="i-heroicons-chevron-down"
        >
          Libraries
          <UBadge
            v-if="filterLibs.length"
            :label="String(filterLibs.length)"
            color="primary"
            variant="solid"
            size="sm"
            class="ml-1"
          />
        </UButton>

        <template #content>
          <div class="flex items-center justify-between">
            <span
              class="text-xs font-medium uppercase tracking-widest text-muted"
              >Libraries</span
            >
            <UButton
              v-if="filterLibs.length"
              variant="ghost"
              color="neutral"
              size="xs"
              @click="filterLibs = []"
              >Clear</UButton
            >
          </div>

          <div class="flex flex-wrap gap-1.5">
            <UButton
              v-for="lib in allLibs"
              :key="lib.key"
              :color="filterLibs.includes(lib.key) ? 'primary' : 'neutral'"
              :variant="filterLibs.includes(lib.key) ? 'solid' : 'subtle'"
              size="xs"
              class="rounded-full"
              :aria-pressed="filterLibs.includes(lib.key)"
              @click="toggleLib(lib.key)"
              >{{ lib.label }}</UButton
            >
          </div>
        </template>
      </UPopover>
    </div>

    <template v-if="!iconsLoaded">
      <div class="flex items-center justify-center h-40 gap-3 text-muted">
        <UIcon name="i-heroicons-arrow-path" class="size-5 animate-spin" />
        <span>Loading icons…</span>
      </div>
    </template>

    <template v-else-if="!hasFilters">
      <div class="grid grid-cols-4 lg:grid-cols-12 gap-2 my-6">
        <UTooltip
          v-for="icon in featuredIcons"
          :key="icon.id"
          :text="icon.name"
          :delay-duration="300"
        >
          <button
            :class="tileClass"
            :aria-label="`${icon.name} from ${libLabels[icon.lib] ?? icon.lib}`"
            @click="openIcon(icon)"
          >
            <div class="w-full aspect-square flex items-center justify-center">
              <span
                class="size-6 flex items-center justify-center [&>svg]:size-full"
                v-html="makeSvg(icon, 24)"
              />
            </div>
            <span
              class="text-[10px] font-mono text-muted truncate w-full text-center px-1 pb-1.5"
            >
              {{ icon.name }}
            </span>
          </button>
        </UTooltip>
      </div>
    </template>

    <template v-else>
      <div ref="grid" class="overflow-y-auto rounded-xl h-[60vh] min-h-80 my-6">
        <div
          class="relative w-full"
          :style="{ height: `${rowVirtualizer.getTotalSize()}px` }"
        >
          <div
            v-for="row in rowVirtualizer.getVirtualItems()"
            :ref="(el) => rowVirtualizer.measureElement(el as Element)"
            :data-index="row.index"
            class="absolute top-0 left-0 w-full grid grid-cols-4 lg:grid-cols-12 gap-2"
            :style="{ transform: `translateY(${row.start}px)` }"
          >
            <UTooltip
              v-for="icon in rows[row.index]"
              :key="icon.id"
              :text="icon.name"
              :delay-duration="300"
            >
              <button
                :class="tileClass"
                :aria-label="`${icon.name} from ${libLabels[icon.lib] ?? icon.lib}`"
                @click="openIcon(icon)"
              >
                <div
                  class="w-full aspect-square flex items-center justify-center"
                >
                  <span
                    class="size-6 flex items-center justify-center [&>svg]:size-full"
                    v-html="makeSvg(icon, 24)"
                  />
                </div>
                <span
                  class="text-[10px] font-mono text-muted truncate w-full text-center px-1 pb-1.5"
                >
                  {{ icon.name }}
                </span>
              </button>
            </UTooltip>
          </div>
        </div>
      </div>
    </template>

    <UModal
      v-model:open="modalOpen"
      :ui="{
        content: 'sm:max-w-lg p-0 overflow-hidden gap-0 min-h-100',
        overlay: 'backdrop-blur-sm',
      }"
    >
      <template #content>
        <div
          v-if="selectedIcon"
          class="flex flex-col sm:flex-row h-full min-h-100"
        >
          <div
            class="flex flex-col items-center gap-4 p-6 sm:w-44 shrink-0 border-b sm:border-b-0 sm:border-r border-default bg-elevated/50"
          >
            <div
              class="size-20 flex items-center justify-center rounded-2xl border border-default bg-elevated shadow-sm"
            >
              <span
                class="size-12 flex items-center justify-center [&>svg]:size-full"
                v-html="makeSvg(selectedIcon, 48)"
              />
            </div>
            <div class="text-center w-full">
              <p class="text-sm font-semibold font-mono break-word">
                {{ selectedIcon.name }}
              </p>
              <p class="text-xs text-muted mt-0.5">
                {{ libLabels[selectedIcon.lib] ?? selectedIcon.lib }}
              </p>
            </div>
          </div>

          <div class="flex-1 flex flex-col divide-y divide-default min-w-0">
            <div class="p-4 flex flex-col gap-1.5">
              <span
                class="text-xs font-medium uppercase tracking-widest text-muted"
                >CSS Class</span
              >
              <div class="flex items-center gap-2">
                <code
                  class="font-mono text-sm flex-1 min-w-0 truncate text-default"
                  >{{ iconClass(selectedIcon) }}</code
                >
                <UButton
                  :icon="
                    copied === `cls:${selectedIcon.id}`
                      ? 'i-heroicons-check'
                      : 'i-heroicons-document-duplicate'
                  "
                  :color="
                    copied === `cls:${selectedIcon.id}` ? 'success' : 'neutral'
                  "
                  variant="ghost"
                  size="xs"
                  :padded="false"
                  :aria-label="`Copy CSS class for ${selectedIcon.name}`"
                  @click="
                    copy(
                      iconClass(selectedIcon),
                      `cls:${selectedIcon.id}`,
                      `class for ${selectedIcon.name}`,
                    )
                  "
                />
              </div>
            </div>

            <div class="p-4 flex flex-col gap-1.5 flex-1">
              <div class="flex items-center justify-between">
                <span
                  class="text-xs font-medium uppercase tracking-widest text-muted"
                  >SVG Code</span
                >
                <UButton
                  :icon="
                    copied === `svg:${selectedIcon.id}`
                      ? 'i-heroicons-check'
                      : 'i-heroicons-document-duplicate'
                  "
                  :color="
                    copied === `svg:${selectedIcon.id}` ? 'success' : 'neutral'
                  "
                  variant="ghost"
                  size="xs"
                  :padded="false"
                  :aria-label="`Copy SVG for ${selectedIcon.name}`"
                  @click="
                    copy(
                      makeSvg(selectedIcon),
                      `svg:${selectedIcon.id}`,
                      `SVG for ${selectedIcon.name}`,
                    )
                  "
                />
              </div>
              <UTextarea
                variant="soft"
                readonly
                :value="makeSvg(selectedIcon)"
                class="flex-1"
                :ui="{ base: 'h-full resize-none' }"
              />
            </div>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
