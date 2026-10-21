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

type IconSet = {
  lib: string;
  width: number;
  height: number;
  icons: {
    key: string;
    name: string;
    body: string;
    w?: number;
    h?: number;
    tags?: string[];
  }[];
};

const maxResults = 2000;

type Lib = {
  label: string;
  url: string;
  files: string[];
};

type LibStatus = 'loading' | 'loaded' | 'error';

const libs: Record<string, Lib> = {
  heroicons: {
    label: 'Heroicons',
    url: 'https://heroicons.com',
    files: ['heroicons'],
  },
  lucide: {
    label: 'Lucide',
    url: 'https://lucide.dev',
    files: ['lucide'],
  },
  ph: {
    label: 'Phosphor',
    url: 'https://phosphoricons.com',
    files: ['ph'],
  },
  fa6: {
    label: 'Font Awesome 6',
    url: 'https://fontawesome.com',
    files: ['fa6-solid', 'fa6-regular', 'fa6-brands'],
  },
  hugeicons: {
    label: 'Hugeicons',
    url: 'https://hugeicons.com',
    files: ['hugeicons'],
  },
  solar: {
    label: 'Solar',
    url: 'https://solar-icons.vercel.app/',
    files: ['solar'],
  },
  carbon: {
    label: 'Carbon',
    url: 'https://carbondesignsystem.com/elements/icons/library/',
    files: ['carbon'],
  },
  'simple-icons': {
    label: 'Simple Icons',
    url: 'https://simpleicons.org',
    files: ['simple-icons'],
  },
};

const defaultLibs = ['heroicons', 'lucide', 'fa6', 'hugeicons'];

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

const iconsByLib = ref<Record<string, IconEntry[]>>({});
const libStatus = ref<Record<string, LibStatus>>({});

const allIcons = computed(() => {
  return Object.keys(libs).flatMap((key) => iconsByLib.value[key] ?? []);
});

const dataUrl = `${useRuntimeConfig().app.baseURL}data/icons`;

const loadSet = async (prefix: string): Promise<IconEntry[]> => {
  const res = await fetch(`${dataUrl}/${prefix}.json`);
  if (!res.ok) throw new Error(res.statusText);

  const set = (await res.json()) as IconSet;
  return set.icons.map((icon) => {
    return {
      id: `${prefix}:${icon.key}`,
      name: icon.name,
      lib: set.lib,
      tags: icon.tags ?? [],
      body: icon.body,
      w: icon.w ?? set.width,
      h: icon.h ?? set.height,
    };
  });
};

const loadLib = async (key: string) => {
  const status = libStatus.value[key];
  if (status === 'loading' || status === 'loaded') {
    return;
  }

  libStatus.value[key] = 'loading';
  try {
    const sets = await Promise.all(libs[key].files.map(loadSet));
    iconsByLib.value[key] = sets.flat();
    libStatus.value[key] = 'loaded';
  } catch {
    libStatus.value[key] = 'error';
  }
};

onMounted(() => {
  filterLibs.value.forEach(loadLib);
});

const iconById = computed(
  () => new Map(allIcons.value.map((icon) => [icon.id, icon])),
);

const makeSvg = (icon: IconEntry, size?: number) => {
  const sizeAttrs = size ? ` width="${size}" height="${size}"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${icon.w} ${icon.h}"${sizeAttrs} fill="currentColor">${icon.body}</svg>`;
};

const iconClass = (icon: IconEntry) => `i-${icon.id.replace(':', '-')}`;

const allLibs = computed(() => {
  return Object.entries(libs).map(([key, lib]) => {
    const count = iconsByLib.value[key]?.length;
    return {
      key,
      label: count ? `${lib.label} (${count.toLocaleString()})` : lib.label,
      loading: libStatus.value[key] === 'loading',
    };
  });
});

const query = ref('');
const search = refDebounced(query, 150);
const filterLibs = ref<string[]>(defaultLibs);
const copied = ref<string | null>(null);
const grid = ref<HTMLElement | null>(null);
const announcement = ref('');
const selectedIcon = ref<IconEntry | null>(null);
const modalOpen = ref(false);

const isDefaultLibs = computed(() => {
  return (
    filterLibs.value.length === defaultLibs.length &&
    defaultLibs.every((key) => filterLibs.value.includes(key))
  );
});

const hasFilters = computed(() => search.value || !isDefaultLibs.value);

const openIcon = (icon: IconEntry) => {
  selectedIcon.value = icon;
  copied.value = null;
  modalOpen.value = true;
};

const hasError = computed(() => {
  return filterLibs.value.some((key) => libStatus.value[key] === 'error');
});

const isLoading = computed(() => {
  return filterLibs.value.some((key) => libStatus.value[key] !== 'loaded');
});

const toggleLib = (key: string) => {
  if (filterLibs.value.includes(key)) {
    filterLibs.value = filterLibs.value.filter((lib) => lib !== key);
    return;
  }

  filterLibs.value = [...filterLibs.value, key];
  loadLib(key);
};

const retry = () => {
  filterLibs.value.forEach(loadLib);
};

const downloadSvg = (icon: IconEntry) => {
  const svg = makeSvg(icon);
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${icon.id.replace(':', '-')}.svg`;
  a.click();
  URL.revokeObjectURL(url);
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
  <ToolPage>
    <div aria-live="polite" aria-atomic="true" class="sr-only">
      {{ announcement }}
    </div>


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
              :loading="lib.loading"
              :aria-pressed="filterLibs.includes(lib.key)"
              @click="toggleLib(lib.key)"
              >{{ lib.label }}</UButton
            >
          </div>
        </template>
      </UPopover>
    </div>

    <UAlert
      v-if="hasError"
      color="error"
      variant="subtle"
      title="Couldn't load icons"
      class="my-6"
    >
      <template #actions>
        <UButton color="neutral" variant="outline" size="xs" @click="retry">
          Retry
        </UButton>
      </template>
    </UAlert>

    <template v-else-if="isLoading">
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
            :aria-label="`${icon.name} from ${libs[icon.lib].label}`"
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
                :aria-label="`${icon.name} from ${libs[icon.lib].label}`"
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
                {{ libs[selectedIcon.lib].label }}
              </p>
            </div>
            <div class="flex flex-col gap-2 w-full">
              <UButton
                :icon="
                  copied === `cls:${selectedIcon.id}`
                    ? 'i-heroicons-check'
                    : 'i-heroicons-document-duplicate'
                "
                :color="
                  copied === `cls:${selectedIcon.id}` ? 'success' : 'neutral'
                "
                variant="soft"
                class="w-full justify-center"
                :aria-label="`Copy CSS class for ${selectedIcon.name}`"
                @click="
                  copy(
                    iconClass(selectedIcon),
                    `cls:${selectedIcon.id}`,
                    `class for ${selectedIcon.name}`,
                  )
                "
              >
                {{ copied === `cls:${selectedIcon.id}` ? '' : 'Copy class' }}
              </UButton>
              <UButton
                icon="i-heroicons-arrow-down-tray"
                color="neutral"
                variant="soft"
                class="w-full justify-center"
                :aria-label="`Download SVG for ${selectedIcon.name}`"
                @click="downloadSvg(selectedIcon)"
              >
                Download
              </UButton>
            </div>
          </div>

          <div class="flex-1 flex flex-col divide-y divide-default min-w-0">
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

    <div class="flex items-center justify-center gap-1.5 pt-2 flex-wrap">
      <p class="text-xs text-dimmed">
        Icons from
        <template v-for="(lib, key, index) in libs" :key="key">
          <template v-if="index"> · </template>
          <ULink
            :to="lib.url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-dimmed hover:text-muted underline underline-offset-2 transition-colors"
          >
            {{ lib.label }}
          </ULink>
        </template>
      </p>
    </div>
  </ToolPage>
</template>
