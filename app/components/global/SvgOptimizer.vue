<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import JSZip from 'jszip';
import { optimize } from 'svgo/browser';

interface SvgItem {
  id: string;
  name: string;
  raw: string;
  optimized: string;
  origSize: number;
  optSize: number;
}

const svgoConfig = {
  multipass: true,
  plugins: [
    { name: 'preset-default', params: { overrides: { removeViewBox: false } } },
  ],
};

const items = ref<SvgItem[]>([]);
const inputText = ref('');
const pastedItem = ref<SvgItem | null>(null);

const dragging = ref(false);
const copiedId = ref<string | null>(null);
const picker = ref<HTMLInputElement | null>(null);
const busy = ref(false);

const tabs = [
  {
    value: 'upload',
    label: 'File Upload',
    icon: 'i-heroicons-document-arrow-up',
  },
  { value: 'paste', label: 'Paste Code', icon: 'i-heroicons-code-bracket' },
];
const activeTab = ref(tabs[0].value);

const totalSaved = computed(() => {
  let orig = 0,
    opt = 0;
  for (const item of items.value) {
    orig += item.origSize;
    opt += item.optSize;
  }
  return orig ? ((orig - opt) / orig) * 100 : 0;
});

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024,
    sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function processSvgString(raw: string) {
  return optimize(raw, svgoConfig).data;
}

let pasteTimeout: ReturnType<typeof setTimeout>;
watch(inputText, (val) => {
  clearTimeout(pasteTimeout);
  pasteTimeout = setTimeout(() => {
    const trimmed = val.trim();
    if (
      !trimmed ||
      (!trimmed.startsWith('<svg') &&
        !trimmed.includes('xmlns="http://www.w3.org/2000/svg"'))
    ) {
      pastedItem.value = null;
      return;
    }

    try {
      const optimized = processSvgString(trimmed);
      pastedItem.value = {
        id: 'paste',
        name: 'pasted.svg',
        raw: trimmed,
        optimized,
        origSize: new Blob([trimmed]).size,
        optSize: new Blob([optimized]).size,
      };
    } catch {
      pastedItem.value = null;
    }
  }, 300);
});

function addSvg(name: string, raw: string) {
  try {
    const optimized = processSvgString(raw);
    items.value.unshift({
      id: crypto.randomUUID(),
      name,
      raw,
      optimized,
      origSize: new Blob([raw]).size,
      optSize: new Blob([optimized]).size,
    });
  } catch (err) {
    console.error(err);
  }
}

function processFiles(files: FileList | File[]) {
  for (const file of files) {
    if (
      file.type !== 'image/svg+xml' &&
      !file.name.toLowerCase().endsWith('.svg')
    )
      continue;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) addSvg(file.name, e.target.result as string);
    };
    reader.readAsText(file);
  }
}

function handleDrop(e: DragEvent) {
  dragging.value = false;
  if (e.dataTransfer?.files) processFiles(e.dataTransfer.files);
}

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files) {
    processFiles(target.files);
    target.value = '';
  }
}

async function copyOpt(item: SvgItem, overrideId?: string) {
  try {
    await navigator.clipboard.writeText(item.optimized);
    copiedId.value = overrideId || item.id;
    setTimeout(() => (copiedId.value = null), 2000);
  } catch (err) {
    console.error(err);
  }
}

function triggerDownload(filename: string, content: string) {
  const blob = new Blob([content], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.toLowerCase().endsWith('.svg')
    ? filename.replace(/\.svg$/, '.min.svg')
    : `${filename}.min.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function downloadZip() {
  if (!items.value.length) return;
  busy.value = true;
  try {
    const zip = new JSZip();
    for (const item of items.value) {
      const name = item.name.toLowerCase().endsWith('.svg')
        ? item.name.replace(/\.svg$/, '.min.svg')
        : `${item.name}.min.svg`;
      zip.file(name, item.optimized);
    }
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'optimized-svgs.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="space-y-8 max-w-6xl mx-auto">
    <div class="space-y-2">
      <h1 class="text-2xl md:text-3xl font-bold text-white">SVG Optimizer</h1>
      <p class="text-base-400">Compress and clean up SVG files.</p>
    </div>

    <div class="space-y-4">
      <UTabs
        v-model="activeTab"
        :items="tabs"
        :content="false"
        class="w-full md:w-80"
      />

      <div v-if="activeTab === 'upload'" class="pt-2 space-y-8">
        <UCard
          class="border-2 border-dashed transition-all duration-200 min-h-62.5 flex items-center justify-center"
          :class="
            dragging
              ? 'border-primary-500 bg-primary-500/10'
              : 'border-base-800 bg-base-900/30 hover:border-base-700'
          "
          @dragover.prevent="dragging = true"
          @dragleave.prevent="dragging = false"
          @drop.prevent="handleDrop"
        >
          <div
            class="flex flex-col items-center justify-center p-6 text-center outline-none w-full h-full"
            role="button"
            tabindex="0"
            @click="picker?.click()"
            @keydown.enter="picker?.click()"
          >
            <UIcon
              name="i-heroicons-cloud-arrow-up"
              class="w-12 h-12 text-base-500 mb-4 group-hover:text-primary-500 transition-colors"
            />
            <p class="text-base font-medium text-white">
              Click or drag SVGs here
            </p>
            <input
              ref="picker"
              type="file"
              multiple
              accept=".svg,image/svg+xml"
              class="hidden"
              @change="handleFileSelect"
            />
          </div>
        </UCard>

        <div
          v-if="items.length > 0"
          class="space-y-4 pt-4 border-t border-base-800"
        >
          <div
            class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-base-900/50 border border-base-800 rounded-xl gap-4 shadow-sm"
          >
            <div>
              <p
                class="text-xs text-base-400 font-semibold uppercase tracking-wider mb-1"
              >
                Total Saved
              </p>
              <p class="text-3xl font-bold text-white">
                {{ totalSaved.toFixed(1) }}%
              </p>
            </div>
            <div class="flex flex-wrap gap-3">
              <UButton
                variant="soft"
                icon="i-heroicons-trash"
                @click="items = []"
                >Clear All</UButton
              >
              <UButton
                v-if="items.length > 1"
                icon="i-heroicons-arrow-down-tray"
                color="primary"
                :loading="busy"
                @click="downloadZip"
              >
                Download All
              </UButton>
            </div>
          </div>

          <div class="space-y-3 mt-4">
            <h3
              class="text-xs font-semibold text-base-400 uppercase tracking-wider mb-2 px-1"
            >
              Optimized Files
            </h3>
            <div
              v-for="item in items"
              :key="item.id"
              class="p-4 border border-base-800 rounded-xl bg-base-900/40 hover:bg-base-900/60 transition-colors group"
            >
              <div class="flex items-start justify-between gap-4 mb-3">
                <p
                  class="font-medium text-white truncate flex-1"
                  :title="item.name"
                >
                  {{ item.name }}
                </p>
              </div>

              <div
                class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div>
                  {{ formatBytes(item.origSize) }}
                  to
                  <strong>{{ formatBytes(item.optSize) }}</strong>
                </div>

                <div class="flex items-center gap-2 w-full sm:w-auto">
                  <UButton
                    :icon="
                      copiedId === item.id
                        ? 'i-heroicons-check'
                        : 'i-heroicons-clipboard-document'
                    "
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    class="flex-1 sm:flex-none justify-center"
                    @click="copyOpt(item)"
                  >
                    <span class="sm:hidden">Copy</span>
                  </UButton>
                  <UButton
                    icon="i-heroicons-arrow-down-tray"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    class="flex-1 sm:flex-none justify-center"
                    @click="triggerDownload(item.name, item.optimized)"
                  >
                    <span class="sm:hidden">Save</span>
                  </UButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'paste'" class="pt-2">
        <UCard class="border border-base-800 bg-base-900/30 flex flex-col">
          <div class="space-y-4 flex-1 flex flex-col">
            <div class="space-y-2">
              <label
                class="text-xs font-semibold text-base-400 uppercase tracking-wider"
                >Input SVG</label
              >
              <UTextarea
                v-model="inputText"
                :rows="6"
                placeholder="<svg>...</svg>"
                class="font-mono w-full mt-3"
                variant="subtle"
              />
            </div>

            <div v-if="pastedItem" class="space-y-3 pt-4">
              <div class="flex items-center justify-between">
                <label
                  class="text-xs font-semibold text-base-400 uppercase tracking-wider"
                  >Optimized Output</label
                >
                <div
                  class="flex items-center gap-2 text-xs text-base-400 font-mono bg-base-950/50 px-2 py-1"
                >
                  {{ formatBytes(pastedItem.origSize) }}
                  to
                  <strong>{{ formatBytes(pastedItem.optSize) }}</strong>
                </div>
              </div>

              <UTextarea
                :model-value="pastedItem.optimized"
                :rows="6"
                readonly
                class="font-mono w-full"
                variant="subtle"
              />

              <div class="flex justify-end gap-2 mt-3">
                <UButton
                  :icon="
                    copiedId === 'paste'
                      ? 'i-heroicons-check'
                      : 'i-heroicons-clipboard-document'
                  "
                  variant="soft"
                  @click="copyOpt(pastedItem, 'paste')"
                >
                  {{ copiedId === 'paste' ? 'Copied' : 'Copy' }}
                </UButton>
                <UButton
                  icon="i-heroicons-arrow-down-tray"
                  color="primary"
                  @click="
                    triggerDownload(pastedItem.name, pastedItem.optimized)
                  "
                >
                  Download
                </UButton>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
