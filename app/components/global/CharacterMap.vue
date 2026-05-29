<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  refDebounced,
  useBreakpoints,
  breakpointsTailwind,
} from '@vueuse/core';
import { useVirtualizer } from '@tanstack/vue-virtual';

interface Char {
  cp: number;
  hex: string;
  char: string;
  name: string;
  cat: string;
  catName: string;
  group: string;
  block: string;
  keywords: string[];
  entity?: string;
}

interface CharData {
  meta: {
    generated: string;
    source: string;
    total: number;
    groups: { name: string; count: number }[];
    blocks: { name: string; count: number }[];
  };
  characters: Char[];
}

const MAX_RESULTS = 2000;
const ROW_HEIGHT = 80;
const CACHE_KEY = 'char-map-v1';
const STORE = 'charmap';
const DB = 'charmapdb';

const commonCodePoints = [
  0x00a9, 0x00ae, 0x2122, 0x2019, 0x201c, 0x201d, 0x2014, 0x2013, 0x2026,
  0x2022, 0x2020, 0x00b0, 0x00b1, 0x00d7, 0x00f7, 0x2260, 0x2264, 0x2265,
  0x00bc, 0x00bd, 0x00be, 0x20ac, 0x00a3, 0x00a5, 0x2630, 0x2665, 0x2605,
  0x2713, 0x2717, 0x2013, 0x1f600, 0x1f44d, 0x2764, 0x1f525, 0x1f918, 0x270c,
];

const data = ref<CharData | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const selected = ref<Char | null>(null);
const modalOpen = ref(false);
const copied = ref<string | null>(null);

const query = ref('');
const debouncedQuery = refDebounced(query, 150);
const filters = ref<string[]>([]);
const grid = ref<HTMLElement | null>(null);

const tooltip = ref({ visible: false, text: '', x: 0, y: 0 });
let tooltipTimer: ReturnType<typeof setTimeout> | null = null;

const buttonClass =
  'flex flex-col items-center gap-1 p-1.5 rounded-lg border border-transparent transition bg-elevated hover:bg-accented hover:border-default focus:ring-2 focus:ring-primary';

const formatCodePoint = (cp: number) =>
  `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;

const isPrintable = (c: Char) =>
  c.cp >= 0x0020 && c.cat !== 'Cc' && c.cat !== 'Cs';

const filtersWith = (prefix: string) =>
  filters.value
    .filter((v) => v.startsWith(`${prefix}:`))
    .map((v) => v.slice(prefix.length + 1));

const activeGroups = computed(() => filtersWith('group'));
const activeBlocks = computed(() => filtersWith('block'));
const countActive = (prefix: string) =>
  filters.value.filter((v) => v.startsWith(`${prefix}:`)).length;

const hasFilters = computed(() => debouncedQuery.value || filters.value.length);

const toggleFilter = (val: string) => {
  const i = filters.value.indexOf(val);
  if (i === -1) filters.value.push(val);
  else filters.value.splice(i, 1);
};

const clearFilters = (prefix: string) => {
  filters.value = filters.value.filter((v) => !v.startsWith(`${prefix}:`));
};

const resetAll = () => {
  query.value = '';
  filters.value = [];
};

const filterCategories = computed(() => [
  {
    label: 'Groups',
    prefix: 'group',
    items: data.value?.meta.groups ?? [],
    width: 'w-72',
  },
  {
    label: 'Blocks',
    prefix: 'block',
    items: data.value?.meta.blocks ?? [],
    width: 'w-80',
  },
]);

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const readCache = (db: IDBDatabase): Promise<CharData | undefined> =>
  new Promise((resolve, reject) => {
    const req = db
      .transaction(STORE, 'readonly')
      .objectStore(STORE)
      .get(CACHE_KEY);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const writeCache = (db: IDBDatabase, val: CharData): Promise<void> =>
  new Promise((resolve, reject) => {
    const req = db
      .transaction(STORE, 'readwrite')
      .objectStore(STORE)
      .put(val, CACHE_KEY);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

const fetchData = async (db: IDBDatabase) => {
  const res = await fetch('/tools/data/character-map.json');
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load data`);
  data.value = await res.json();
  await writeCache(db, data.value!).catch(() => {});
};

if (import.meta.client) {
  useHead?.({
    link: [
      {
        rel: 'preload',
        as: 'fetch',
        href: '/data/character-map.json',
        crossorigin: 'anonymous',
      },
    ],
  });
}

onMounted(async () => {
  if (!import.meta.client) return;
  try {
    const db = await openDb();
    const cached = await readCache(db);
    if (cached) {
      data.value = cached;
      fetchData(db).catch(() => {});
    } else {
      await fetchData(db);
    }
  } catch (err: any) {
    error.value = err.message || String(err);
  } finally {
    loading.value = false;
  }
});

const commonChars = computed(() => {
  if (!data.value) return [];
  const byCp = new Map(data.value.characters.map((c) => [c.cp, c]));
  return commonCodePoints
    .filter((cp) => byCp.has(cp))
    .map((cp) => byCp.get(cp)!);
});

const filteredChars = computed(() => {
  if (!data.value) return [];
  let chars = data.value.characters;

  if (activeGroups.value.length)
    chars = chars.filter((c) => activeGroups.value.includes(c.group));
  if (activeBlocks.value.length)
    chars = chars.filter((c) => activeBlocks.value.includes(c.block));

  const q = debouncedQuery.value.trim().toLowerCase();
  if (q) {
    const hexMatch = q.match(/^(?:u\+|0x)?([0-9a-f]{1,6})$/);
    if (hexMatch) {
      const target = parseInt(hexMatch[1], 16);
      chars = chars.filter((c) => c.cp === target);
    } else {
      const points = [...q];
      const isSingleChar =
        points.length === 1 ||
        (points.length === 2 && q.codePointAt(0)! > 0xffff);
      if (isSingleChar) {
        chars = chars.filter((c) => c.cp === q.codePointAt(0)!);
      } else {
        chars = chars.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.keywords.some((k) => k.includes(q)) ||
            c.entity?.toLowerCase().includes(q) ||
            c.catName.toLowerCase().includes(q) ||
            c.block.toLowerCase().includes(q),
        );
      }
    }
  }
  return chars.slice(0, MAX_RESULTS);
});

const columns = computed(() =>
  useBreakpoints(breakpointsTailwind).greaterOrEqual('lg').value ? 12 : 3,
);

const rows = computed(() => {
  const result: Char[][] = [];
  for (let i = 0; i < filteredChars.value.length; i += columns.value)
    result.push(filteredChars.value.slice(i, i + columns.value));
  return result;
});

const virtualGrid = useVirtualizer(
  computed(() => ({
    count: rows.value.length,
    getScrollElement: () => grid.value,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
  })),
);

const showTooltip = (e: PointerEvent) => {
  if (!matchMedia('(hover: hover)').matches) return;
  const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-name]');
  if (!btn) return;
  if (tooltipTimer) clearTimeout(tooltipTimer);
  tooltipTimer = setTimeout(() => {
    const rect = btn.getBoundingClientRect();
    tooltip.value = {
      visible: true,
      text: btn.dataset.name || '',
      x: rect.left + rect.width / 2,
      y: rect.bottom + window.scrollY + 6,
    };
  }, 300);
};

const hideTooltip = () => {
  if (tooltipTimer) clearTimeout(tooltipTimer);
  tooltip.value.visible = false;
};

const openDetails = (c: Char) => {
  selected.value = c;
  copied.value = null;
  modalOpen.value = true;
};

const copy = async (text: string, label: string) => {
  try {
    await navigator.clipboard.writeText(text);
    copied.value = label;
    setTimeout(() => (copied.value = null), 1500);
  } catch (err) {
    console.error('Clipboard copy failed', err);
  }
};

const modalDetails = computed(() => {
  if (!modalOpen.value || !selected.value) return [];
  const c = selected.value;
  return [
    {
      label: 'Character',
      value: isPrintable(c) ? c.char : '(non-printable)',
      copyable: isPrintable(c),
    },
    { label: 'Unicode', value: formatCodePoint(c.cp), copyable: true },
    ...(c.entity
      ? [{ label: 'HTML entity', value: c.entity, copyable: true }]
      : []),
    { label: 'Decimal', value: `&#${c.cp};`, copyable: true },
    { label: 'Hex', value: `&#x${c.hex.toUpperCase()};`, copyable: true },
    {
      label: 'CSS/JS escape',
      value: `\\u${c.hex.toUpperCase().padStart(4, '0')}`,
      copyable: true,
    },
    { label: 'URL encoded', value: encodeURIComponent(c.char), copyable: true },
  ];
});
</script>

<template>
  <div class="space-y-4 pb-12">
    <header class="max-w-2xl">
      <h1 class="text-2xl md:text-3xl font-bold text-white mb-1">
        Character Map
      </h1>
      <p class="text-base-400">
        Browse symbols, emojis, and special characters.
      </p>
    </header>

    <div
      v-if="loading"
      class="flex items-center justify-center gap-3 py-20 text-muted"
    >
      <UIcon name="i-heroicons-arrow-path" class="size-5 animate-spin" />
      <span>Loading character data…</span>
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      variant="soft"
      :title="error"
      icon="i-heroicons-exclamation-triangle"
      description="Make sure you've run: node scripts/fetch-unicode-data.mjs"
    />

    <template v-else-if="data">
      <div class="flex gap-2 items-center">
        <UInput
          v-model="query"
          placeholder="Search name, keyword, U+code..."
          icon="i-heroicons-magnifying-glass"
          variant="subtle"
          size="lg"
          class="flex-1 font-mono"
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

        <UPopover
          v-for="cat in filterCategories"
          :key="cat.prefix"
          :ui="{ content: cat.width }"
        >
          <UButton
            variant="subtle"
            size="lg"
            :color="countActive(cat.prefix) ? 'primary' : 'neutral'"
            :trailing-icon="
              countActive(cat.prefix) ? undefined : 'i-heroicons-chevron-down'
            "
          >
            {{ cat.label }}
            <UBadge
              v-if="countActive(cat.prefix)"
              :label="String(countActive(cat.prefix))"
              color="primary"
              variant="solid"
              size="sm"
              class="ml-1"
            />
          </UButton>

          <template #content>
            <div class="p-3 space-y-2">
              <div class="flex items-center justify-between">
                <span
                  class="text-xs uppercase tracking-widest text-muted font-medium"
                >
                  {{ cat.label }}
                </span>
                <UButton
                  v-if="countActive(cat.prefix)"
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  @click="clearFilters(cat.prefix)"
                >
                  Clear
                </UButton>
              </div>
              <div
                class="flex flex-wrap gap-1.5"
                :class="
                  cat.prefix === 'block' ? 'max-h-64 overflow-y-auto' : ''
                "
              >
                <button
                  v-for="item in cat.items"
                  :key="`${cat.prefix}:${item.name}`"
                  class="px-2.5 py-1 rounded-full text-xs font-medium border transition"
                  :class="
                    filters.includes(`${cat.prefix}:${item.name}`)
                      ? 'bg-primary text-white border-primary'
                      : 'bg-elevated border-default text-muted hover:text-primary'
                  "
                  @click="toggleFilter(`${cat.prefix}:${item.name}`)"
                >
                  {{ item.name }}
                </button>
              </div>
            </div>
          </template>
        </UPopover>
      </div>

      <div v-if="!hasFilters" class="space-y-2">
        <p class="text-xs text-muted font-medium uppercase tracking-widest">
          Common characters
        </p>
        <div
          class="grid grid-cols-3 lg:grid-cols-12 gap-2"
          @pointerenter.passive="showTooltip"
          @pointerleave="hideTooltip"
        >
          <button
            v-for="c in commonChars"
            :key="c.cp"
            :class="buttonClass"
            :data-name="c.name"
            :aria-label="`${c.name} ${formatCodePoint(c.cp)}`"
            @click="openDetails(c)"
          >
            <span class="text-2xl char-glyph" aria-hidden="true">
              {{ c.char }}
            </span>
            <span class="text-[10px] font-mono text-muted">
              {{ formatCodePoint(c.cp) }}
            </span>
          </button>
        </div>
      </div>

      <template v-else>
        <div class="flex items-center justify-between gap-2">
          <p class="text-xs text-muted tabular-nums">
            {{
              filteredChars.length === MAX_RESULTS
                ? `Showing first ${MAX_RESULTS} results`
                : `${filteredChars.length} characters`
            }}
          </p>
          <UButton
            variant="ghost"
            color="neutral"
            size="xs"
            icon="i-heroicons-x-mark"
            @click="resetAll"
          >
            Reset
          </UButton>
        </div>

        <div
          v-if="!filteredChars.length"
          class="flex flex-col items-center gap-2 py-20 text-center text-muted"
        >
          <UIcon name="i-heroicons-magnifying-glass" class="size-6" />
          <p class="text-sm">No characters found.</p>
          <UButton variant="soft" size="xs" @click="resetAll">
            Clear search & filters
          </UButton>
        </div>

        <div
          v-else
          ref="grid"
          class="overflow-y-auto rounded-xl h-[60vh] min-h-80"
          @pointerenter.passive="showTooltip"
          @pointerleave="hideTooltip"
        >
          <div
            :style="{
              height: `${virtualGrid.getTotalSize()}px`,
              position: 'relative',
            }"
          >
            <div
              v-for="row in virtualGrid.getVirtualItems()"
              :key="row.key"
              class="grid grid-cols-3 lg:grid-cols-12 gap-x-1 absolute w-full pb-2"
              :style="{
                height: `${row.size}px`,
                transform: `translateY(${row.start}px)`,
              }"
            >
              <button
                v-for="c in rows[row.index]"
                :key="c.cp"
                :class="[buttonClass, { 'opacity-40': !isPrintable(c) }]"
                :data-name="c.name"
                :aria-label="`${c.name} ${formatCodePoint(c.cp)}`"
                @click="openDetails(c)"
              >
                <span class="text-2xl char-glyph" aria-hidden="true">
                  {{ isPrintable(c) ? c.char : '␀' }}
                </span>
                <span class="text-[10px] font-mono text-muted">
                  {{ formatCodePoint(c.cp) }}
                </span>
              </button>
            </div>
          </div>
        </div>

        <Teleport to="body">
          <div
            v-if="tooltip.visible"
            class="fixed z-50 pointer-events-none px-2 py-1 rounded bg-inverted text-inverted text-xs shadow-lg -translate-x-1/2"
            :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
          >
            {{ tooltip.text }}
          </div>
        </Teleport>
      </template>

      <UModal
        v-if="modalOpen"
        v-model:open="modalOpen"
        :ui="{ content: 'sm:max-w-2xl', overlay: 'backdrop-blur-sm' }"
      >
        <template #content>
          <div
            v-if="selected"
            class="flex flex-col sm:flex-row rounded-xl bg-base-900 overflow-hidden"
          >
            <div
              class="flex flex-col items-center gap-5 p-8 sm:w-56 shrink-0 border-b sm:border-b-0 sm:border-r border-default bg-base-950"
            >
              <div
                class="size-28 flex items-center justify-center text-7xl rounded-2xl border border-default bg-base-900 shadow-lg char-glyph"
              >
                {{ isPrintable(selected) ? selected.char : '?' }}
              </div>
              <div class="text-center w-full">
                <p class="text-sm font-semibold text-white">
                  {{ selected.name }}
                </p>
                <p class="text-xs text-muted font-mono mt-1">
                  {{ formatCodePoint(selected.cp) }} · {{ selected.catName }}
                </p>
              </div>
              <UButton
                v-if="isPrintable(selected)"
                :icon="
                  copied === 'char'
                    ? 'i-heroicons-check'
                    : 'i-heroicons-document-duplicate'
                "
                :color="copied === 'char' ? 'success' : 'primary'"
                variant="soft"
                size="sm"
                block
                @click="copy(selected.char, 'char')"
              >
                Copy character
              </UButton>
            </div>

            <div class="flex-1 grid grid-cols-2 gap-px bg-default">
              <div
                v-for="field in modalDetails"
                :key="field.label"
                class="p-4 bg-base-900 flex flex-col gap-2"
              >
                <span class="text-xs uppercase tracking-widest text-muted">
                  {{ field.label }}
                </span>
                <div class="flex items-center gap-2">
                  <code class="font-mono text-sm break-all flex-1">
                    {{ field.value }}
                  </code>
                  <UButton
                    v-if="field.copyable"
                    :icon="
                      copied === field.label
                        ? 'i-heroicons-check'
                        : 'i-heroicons-document-duplicate'
                    "
                    :color="copied === field.label ? 'success' : 'neutral'"
                    variant="ghost"
                    size="xs"
                    :padded="false"
                    @click="copy(field.value, field.label)"
                  />
                </div>
              </div>
            </div>
          </div>
        </template>
      </UModal>
    </template>
  </div>
</template>

<style>
.char-glyph {
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica,
    Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';
}
</style>
