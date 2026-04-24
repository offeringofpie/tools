<script setup lang="ts">
interface Item {
  id: number;
  label: string;
  width: string | null;
  height: string | null;
  grow: number | null;
  shrink: number | null;
  basis: string | null;
  alignSelf: string | null;
  order: number | null;
}

interface Container {
  direction: string;
  wrap: string;
  justifyContent: string;
  justifyItems: string;
  alignItems: string;
  alignContent: string;
}

const containerOpts = [
  { key: 'direction', label: 'flex-direction', opts: ['row', 'row-reverse', 'column', 'column-reverse'] },
  { key: 'wrap', label: 'flex-wrap', opts: ['nowrap', 'wrap', 'wrap-reverse'] },
  { key: 'justifyContent', label: 'justify-content', opts: ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'] },
  { key: 'justifyItems', label: 'justify-items', opts: ['normal', 'stretch', 'flex-start', 'flex-end', 'center', 'baseline'] },
  { key: 'alignItems', label: 'align-items', opts: ['flex-start', 'flex-end', 'center', 'stretch', 'baseline'] },
  { key: 'alignContent', label: 'align-content', opts: ['normal', 'flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'stretch'] },
] as const;

const alignSelfOpts = ['auto', 'flex-start', 'flex-end', 'center', 'stretch', 'baseline'];
const sizeOpts = ['auto', 'max-content', 'min-content', 'fit-content', '0', '2rem', '5rem', '10rem', '100%', '50%', '25%', '20%', '10%'];

const Sections = [
  { key: 'templates' as const, label: 'Templates' },
  { key: 'container' as const, label: 'Container' },
  { key: 'items' as const, label: 'Items' },
];

const FlexOpts = [
  { key: 'grow' as const, label: 'grow', ph: '0' },
  { key: 'shrink' as const, label: 'shrink', ph: '1' },
  { key: 'order' as const, label: 'order', ph: '0' },
];

let nextId = 0;

const toNum = (value: string): number | null => {
  const number = parseFloat(value);
  return isNaN(number) ? null : number;
};

const selectItems = (opts: readonly string[]) => opts.map(v => ({ label: v, value: v }));

const parsePx = (raw: string): string => {
  const s = raw.trim();
  if (!s) return '0px';
  if (/^\d*\.?\d+(px|em|rem|%|vw|vh)$/.test(s)) return s;
  const n = parseFloat(s);
  return isNaN(n) ? '0px' : `${n}px`;
};

const newItem = (i: number, overrides: Partial<Item> = {}): Item => ({
  id: nextId++, label: String(i + 1),
  width: '20%', height: '5rem',
  grow: null, shrink: null, basis: null, alignSelf: null, order: null,
  ...overrides,
});

const newItems = (n: number, overrides?: Partial<Item>) =>
  Array.from({ length: n }, (_, i) => newItem(i, overrides));

const TEMPLATES = [
  { id: 'centered', label: 'Centered', cfg: { direction: 'row', wrap: 'nowrap', justifyContent: 'center', alignItems: 'center' }, gap: '0', items: () => [newItem(0)] },
  { id: 'navbar', label: 'Nav Bar', cfg: { direction: 'row', wrap: 'nowrap', justifyContent: 'space-between', alignItems: 'center' }, gap: '8', items: () => newItems(4) },
  { id: 'sidebar', label: 'Sidebar', cfg: { direction: 'row', wrap: 'nowrap', justifyContent: 'flex-start', alignItems: 'stretch' }, gap: '16', items: () => [newItem(0), newItem(1, { grow: 1 })] },
  { id: 'grid', label: 'Grid', cfg: { direction: 'row', wrap: 'wrap', justifyContent: 'flex-start', alignItems: 'stretch' }, gap: '16', items: () => newItems(6) },
  { id: 'stack', label: 'Stack', cfg: { direction: 'column', wrap: 'nowrap', justifyContent: 'flex-start', alignItems: 'stretch' }, gap: '12', items: () => newItems(4) },
  { id: 'split', label: 'Split', cfg: { direction: 'row', wrap: 'wrap', justifyContent: 'center', alignItems: 'stretch' }, gap: '0', items: () => [newItem(0, { grow: 1 }), newItem(1, { grow: 1 })] },
];

const container = reactive<Container>({
  direction: 'row', wrap: 'wrap', justifyContent: 'flex-start',
  justifyItems: 'normal', alignItems: 'stretch', alignContent: 'normal',
});

const display = ref<'flex' | 'inline-flex'>('flex');
const gap = ref('16');
const items = ref<Item[]>(newItems(5));
const selected = ref<Item | null>(null);
const activeTemplate = ref('');
const openSection = ref<string | null>('container');
const copied = ref(false);

const parsedGap = computed(() => {
  const parts = gap.value.trim().split(/\s+/);
  const row = parsePx(parts[0] ?? '');
  const col = parsePx(parts[1] ?? parts[0] ?? '');
  return { row, col };
});

const containerStyle = computed(() => {
  const { row, col } = parsedGap.value;
  return {
    display: display.value,
    flexDirection: container.direction,
    flexWrap: container.wrap,
    justifyContent: container.justifyContent,
    justifyItems: container.justifyItems,
    alignItems: container.alignItems,
    alignContent: container.alignContent,
    ...(row === col ? { gap: row } : { rowGap: row, columnGap: col }),
  };
});

const styleFor = (item: Item) => {
  const s: Record<string, string> = { flexShrink: String(item.shrink ?? 0) };
  if (item.width) s.width = item.width;
  if (item.height) s.height = item.height;
  if (item.grow !== null) s.flexGrow = String(item.grow);
  if (item.basis !== null) s.flexBasis = item.basis;
  if (item.alignSelf !== null) s.alignSelf = item.alignSelf;
  if (item.order !== null) s.order = String(item.order);
  return s;
};

const css = computed(() => {
  const { row, col } = parsedGap.value;
  const gapLines = row === col ? [`gap: ${row};`] : [`row-gap: ${row};`, `column-gap: ${col};`];

  const lines = [
    `display: ${display.value};`,
    `flex-flow: ${container.direction} ${container.wrap};`,
    `justify-content: ${container.justifyContent};`,
    ...(container.justifyItems !== 'normal' ? [`justify-items: ${container.justifyItems};`] : []),
    `align-items: ${container.alignItems};`,
    ...(container.alignContent !== 'normal' ? [`align-content: ${container.alignContent};`] : []),
    ...gapLines,
  ];

  const groups = new Map<string, number[]>();
  items.value.forEach((item, i) => {
    const props = [
      item.width !== null && `width: ${item.width};`,
      item.height !== null && `height: ${item.height};`,
      item.grow !== null && `flex-grow: ${item.grow};`,
      item.shrink !== null && `flex-shrink: ${item.shrink};`,
      item.basis !== null && `flex-basis: ${item.basis};`,
      item.alignSelf !== null && `align-self: ${item.alignSelf};`,
      item.order !== null && `order: ${item.order};`,
    ].filter(Boolean).join('|');
    groups.set(props, [...(groups.get(props) ?? []), i + 1]);
  });

  const overrides = [...groups.entries()]
    .filter(([k]) => k)
    .map(([k, nums]) => {
      const sel = nums.length === items.value.length
        ? '.container > *'
        : nums.map(n => `.container > :nth-child(${n})`).join(',\n');
      const body = k.split('|').map(l => `  ${l}`).join('\n');
      return `${sel} {\n${body}\n}`;
    });

  const block = (sel: string, ls: string[]) => `${sel} {\n${ls.map(l => `  ${l}`).join('\n')}\n}`;
  return [block('.container', lines), ...overrides].join('\n\n');
});

const addItem = () => items.value.push(newItem(items.value.length));

const removeLast = () => {
  const last = items.value.at(-1);
  if (!last) return;
  if (selected.value?.id === last.id) selected.value = null;
  items.value.pop();
};

const select = (item: Item) => {
  selected.value = selected.value?.id === item.id ? null : item;
  if (selected.value) openSection.value = 'items';
};

const applyTemplate = (tpl: (typeof TEMPLATES)[number]) => {
  nextId = 0;
  Object.assign(container, { alignContent: 'normal', justifyItems: 'normal', ...tpl.cfg });
  gap.value = tpl.gap;
  selected.value = null;
  items.value = tpl.items();
  activeTemplate.value = tpl.id;
};

const copy = async () => {
  try {
    await navigator.clipboard.writeText(css.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  } catch {
    // noop
  }
};

const clearTemplate = () => { activeTemplate.value = ''; };

const tabs = [
  { label: 'Preview', slot: 'preview' as const },
  { label: 'CSS Output', slot: 'css' as const },
];
</script>

<template>
  <div class="space-y-6 max-w-6xl mx-auto">
    <div class="space-y-2">
      <h1 class="text-2xl md:text-3xl font-bold text-white">Flexbox Builder</h1>
      <p class="text-base-400">Learn and build Flexbox CSS.</p>
    </div>

    <div class="flex flex-col-reverse md:flex-row items-start gap-4">
      <main class="flex-1 flex flex-col min-w-0">
        <UTabs :items="tabs" variant="link" class="flex-1 flex flex-col">
          <template #preview>
            <div
              class="flex-1 rounded-xl border border-dashed border-default bg-elevated overflow-auto min-h-44 p-4"
              :style="containerStyle"
            >
              <UButton
                v-for="item in items" :key="item.id"
                variant="subtle" color="primary"
                class="rounded-lg flex items-center justify-center text-xs font-bold font-mono relative select-none ring-2 ring-transparent transition-all cursor-pointer shrink-0"
                :class="selected?.id === item.id && 'ring-primary!'"
                :style="styleFor(item)"
                @click="select(item)"
              >
                {{ item.label }}
              </UButton>
            </div>
          </template>

          <template #css>
            <div class="flex flex-col gap-2">
              <pre class="rounded-lg border border-default bg-elevated px-4 py-3 text-xs font-mono text-highlighted overflow-x-auto leading-relaxed max-h-80 relative">{{ css }}                <UButton
                  block
                  class="absolute top-2 right-2 w-fit p-2"
                  :color="copied ? 'primary' : 'neutral'"
                  size="sm"
                  variant="subtle"
                  :icon="
                    copied ? 'i-heroicons-check' : 'i-heroicons-document-duplicate'
                  "
                  @click="copy"
                /></pre>
            </div>
          </template>
        </UTabs>
      </main>

      <aside class="w-full lg:w-80 shrink-0">
        <div class="lg:overflow-y-auto space-y-1">
          <UCollapsible
            v-for="section in Sections" :key="section.key"
            :open="openSection === section.key"
            @update:open="openSection = openSection === section.key ? null : section.key"
          >
            <UButton variant="soft" color="neutral" class="flex items-center justify-between w-full uppercase tracking-wide">
              {{ section.label }}
              <UIcon
                :name="openSection === section.key ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
                class="size-3.5"
              />
            </UButton>

            <template #content>
              <div v-if="section.key === 'templates'" class="p-3 flex flex-wrap gap-1.5">
                <button
                  v-for="tpl in TEMPLATES" :key="tpl.id"
                  class="w-[calc(50%-0.1875rem)] px-3 py-2 rounded-lg border text-sm text-left transition-all"
                  :class="activeTemplate === tpl.id
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-default bg-elevated hover:bg-accented text-default'"
                  @click="applyTemplate(tpl)"
                >
                  {{ tpl.label }}
                </button>
              </div>

              <div v-else-if="section.key === 'container'" class="p-3 space-y-3">
                <div class="grid grid-cols-2 gap-2">
                  <UFormField label="display">
                    <USelect v-model="display" :items="['flex', 'inline-flex']" variant="subtle" class="w-full" @update:model-value="clearTemplate" />
                  </UFormField>
                  <UFormField label="gap">
                    <UInput v-model="gap" variant="subtle" class="w-full" placeholder="e.g. 16px or 20px 10px" />
                  </UFormField>
                  <UFormField v-for="f in containerOpts" :key="f.key" :label="f.label">
                    <USelect
                      :model-value="container[f.key]" :items="selectItems(f.opts)"
                      value-key="value" variant="subtle" class="w-full"
                      @update:model-value="container[f.key] = $event; clearTemplate()"
                    />
                  </UFormField>
                </div>
              </div>

              <div v-else-if="section.key === 'items'" class="p-3 space-y-3">
                <div class="flex items-center justify-between gap-2">
                  <UButton icon="i-heroicons-plus" label="Add" variant="soft" color="neutral" class="flex-1" @click="addItem" />
                  <UButton v-if="items.length" icon="i-heroicons-minus" label="Remove" variant="soft" color="neutral" class="flex-1" @click="removeLast" />
                </div>

                <p v-if="!selected" class="text-xs text-muted text-center py-2">
                  Click an item in the preview to edit it.
                </p>

                <template v-else>
                  <div class="grid grid-cols-3 gap-2">
                    <UFormField v-for="f in FlexOpts" :key="f.key" :label="f.label">
                      <UInput
                        :model-value="String(selected[f.key] ?? '')" type="number"
                        class="w-full" variant="soft" :placeholder="f.ph"
                        @update:model-value="selected![f.key] = toNum(String($event))"
                      />
                    </UFormField>
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    <UFormField label="flex-basis">
                      <USelect v-model="selected.basis" :items="sizeOpts" variant="subtle" class="w-full" placeholder="auto" />
                    </UFormField>
                    <UFormField label="align-self">
                      <USelect
                        :model-value="selected.alignSelf ?? 'auto'" :items="selectItems(alignSelfOpts)"
                        value-key="value" variant="subtle" class="w-full"
                        @update:model-value="selected!.alignSelf = $event === 'auto' ? null : $event"
                      />
                    </UFormField>
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    <UFormField v-for="key in (['width', 'height'] as const)" :key="key" :label="key">
                      <USelect
                        :model-value="String(selected[key] ?? '')" :items="sizeOpts"
                        variant="subtle" class="w-full" placeholder="auto"
                        @update:model-value="selected![key] = $event"
                      />
                    </UFormField>
                  </div>
                </template>
              </div>
            </template>
          </UCollapsible>
        </div>
      </aside>
    </div>
  </div>
</template>