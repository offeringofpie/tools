<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue';
import JSZip from 'jszip';

interface ImgItem {
  id: string;
  file: File;
  name: string;
  url: string;
  w: number;
  h: number;
  panX: number;
  panY: number;
}

type SizingMode =
  | 'custom'
  | '1.91:1'
  | '16:9'
  | '9:16'
  | '4:3'
  | '3:4'
  | '1:1'
  | 'auto-height'
  | 'auto-width';

const mode = ref<SizingMode>('custom');
const targetW = ref(1000);
const targetH = ref(500);
const quality = ref(80);

const items = ref<ImgItem[]>([]);
const dragging = ref(false);
const busy = ref(false);
const picker = ref<HTMLInputElement | null>(null);

const options = [
  { value: 'custom', label: 'Custom Dimensions' },
  { value: '1.91:1', label: 'OpenGraph (1220x630)' },
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
  { value: '4:3', label: '4:3' },
  { value: '3:4', label: '3:4' },
  { value: '1:1', label: '1:1 (Square)' },
  { value: 'auto-height', label: 'Auto Height' },
  { value: 'auto-width', label: 'Auto Width' },
];

function centerGuide(img: HTMLImageElement) {
  const canvas = document.createElement('canvas');
  const size = 50;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, size, size);

  const { data } = ctx.getImageData(0, 0, size, size);
  let total = 0,
    sumX = 0,
    sumY = 0;

  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const idx = (y * size + x) * 4;
      const energy =
        Math.abs(data[idx] - data[idx + 4]) +
        Math.abs(data[idx] - data[idx + size * 4]);
      const weight =
        energy *
        (1 -
          Math.sqrt(Math.pow(x / size - 0.5, 2) + Math.pow(y / size - 0.5, 2)) *
            0.5);

      if (weight > 10) {
        sumX += x * weight;
        sumY += y * weight;
        total += weight;
      }
    }
  }

  return total === 0
    ? { x: 50, y: 50 }
    : { x: (sumX / total / size) * 100, y: (sumY / total / size) * 100 };
}

async function processFiles(files: FileList | File[]) {
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    await new Promise((r) => {
      img.onload = () => {
        const focus = centerGuide(img);
        items.value.push({
          id: crypto.randomUUID(),
          file,
          name: file.name,
          url,
          w: img.width,
          h: img.height,
          panX: focus.x,
          panY: focus.y,
        });
        r(true);
      };
    });
  }
}

onBeforeUnmount(() => items.value.forEach((i) => URL.revokeObjectURL(i.url)));

function getDimensions(item: ImgItem) {
  if (mode.value === 'auto-height')
    return {
      w: targetW.value,
      h: Math.round(item.h * (targetW.value / item.w)),
    };
  if (mode.value === 'auto-width')
    return {
      w: Math.round(item.w * (targetH.value / item.h)),
      h: targetH.value,
    };
  if (mode.value === 'custom') return { w: targetW.value, h: targetH.value };

  const [rw, rh] = mode.value.split(':').map(Number);
  const ratio = rw / rh;

  const res =
    item.w / item.h > ratio
      ? { h: item.h, w: Math.round(item.h * ratio) }
      : { w: item.w, h: Math.round(item.w / ratio) };

  if (mode.value === '1.91:1' && res.w > 1220) {
    res.w = 1220;
    res.h = 630;
  }

  return res;
}

const isCropping = computed(
  () => !['auto-height', 'auto-width'].includes(mode.value),
);

function getPan(item: ImgItem) {
  if (!isCropping.value) return { canX: false, canY: false };
  const { w, h } = getDimensions(item);
  const ratio = w / h;
  return {
    canX: item.w / item.h > ratio + 0.01,
    canY: item.w / item.h < ratio - 0.01,
  };
}

function getCropStyle(item: ImgItem) {
  const { w, h } = getDimensions(item);
  const imgRatio = item.w / item.h;
  const targetRatio = w / h;
  const boxW = imgRatio > targetRatio ? 100 * (targetRatio / imgRatio) : 100;
  const boxH = imgRatio < targetRatio ? 100 * (imgRatio / targetRatio) : 100;

  return {
    width: `${boxW}%`,
    height: `${boxH}%`,
    left: `${(item.panX / 100) * (100 - boxW)}%`,
    top: `${(item.panY / 100) * (100 - boxH)}%`,
  };
}

const active = ref<ImgItem | null>(null);
let startX = 0,
  startY = 0,
  startPx = 0,
  startPy = 0,
  slackX = 0,
  slackY = 0;

function drag(e: PointerEvent, item: ImgItem) {
  const pan = getPan(item);
  if (!pan.canX && !pan.canY) return;

  const target = e.currentTarget as HTMLElement;
  target.setPointerCapture(e.pointerId);
  active.value = item;
  startX = e.clientX;
  startY = e.clientY;
  startPx = item.panX;
  startPy = item.panY;

  const rect = target.getBoundingClientRect();
  const { w, h } = getDimensions(item);
  const targetRatio = w / h;
  const imgRatio = item.w / item.h;

  const boxWPct = imgRatio > targetRatio ? 100 * (targetRatio / imgRatio) : 100;
  const boxHPct = imgRatio < targetRatio ? 100 * (imgRatio / targetRatio) : 100;

  slackX = rect.width * (1 - boxWPct / 100);
  slackY = rect.height * (1 - boxHPct / 100);

  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
}

function onMove(e: PointerEvent) {
  if (!active.value) return;
  if (slackX > 0)
    active.value.panX = Math.max(
      0,
      Math.min(100, startPx + ((e.clientX - startX) / slackX) * 100),
    );
  if (slackY > 0)
    active.value.panY = Math.max(
      0,
      Math.min(100, startPy + ((e.clientY - startY) / slackY) * 100),
    );
}

function onUp() {
  active.value = null;
  window.removeEventListener('pointermove', onMove);
  window.removeEventListener('pointerup', onUp);
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

function clearAll() {
  items.value.forEach((i) => URL.revokeObjectURL(i.url));
  items.value = [];
}

async function generateBlob(
  item: ImgItem,
): Promise<{ blob: Blob; name: string }> {
  const { w, h } = getDimensions(item);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const img = new Image();
  img.src = item.url;
  await new Promise((r) => (img.onload = r));

  ctx.imageSmoothingQuality = 'high';
  if (isCropping.value) {
    const scale = Math.max(w / img.width, h / img.height);
    const sw = img.width * scale;
    const sh = img.height * scale;
    ctx.drawImage(
      img,
      -(item.panX / 100) * (sw - w),
      -(item.panY / 100) * (sh - h),
      sw,
      sh,
    );
  } else {
    ctx.drawImage(img, 0, 0, w, h);
  }

  const name =
    item.name.replace(/\.[^/.]+$/, '') +
    `_resized.${item.name.split('.').pop() || 'jpg'}`;
  return new Promise((r, reject) =>
    canvas.toBlob(
      (blob) => (blob ? r({ blob, name }) : reject(new Error('Failed'))),
      item.file.type,
      quality.value / 100,
    ),
  );
}

async function download() {
  if (!items.value.length) return;
  busy.value = true;
  try {
    const zip = new JSZip();
    for (const item of items.value) {
      const { blob, name } = await generateBlob(item);
      zip.file(name, blob);
    }
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resized_images.zip';
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert('Failed to generate ZIP.');
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <input
      ref="picker"
      type="file"
      multiple
      accept="image/*"
      class="hidden"
      @change="handleFileSelect"
    />

    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold text-white mb-1">
          Image Resizer
        </h1>
        <p class="text-base-400">Resize Images in bulk!</p>
      </div>
      <div v-if="items.length">
        <UButton variant="soft" icon="i-heroicons-trash" @click="clearAll"
          >Clear</UButton
        >
      </div>
    </div>

    <div class="flex flex-col lg:flex-row gap-6">
      <div v-if="items.length" class="w-full lg:w-80 lg:order-last shrink-0">
        <div class="lg:sticky lg:top-8">
          <UCard
            class="border border-base-800 bg-base-900/50"
            :ui="{ body: { base: 'overflow-visible' } }"
          >
            <template #header>
              <h2
                class="text-xs font-bold text-white uppercase tracking-widest"
              >
                Settings
              </h2>
            </template>
            <div class="space-y-6">
              <UFormGroup label="Resize Strategy">
                <USelect v-model="mode" :items="options" class="w-full mb-6" />
              </UFormGroup>

              <div
                v-if="['custom', 'auto-height', 'auto-width'].includes(mode)"
                class="grid grid-cols-2 gap-3"
              >
                <UFormGroup
                  v-if="['custom', 'auto-height'].includes(mode)"
                  label="Width"
                >
                  <UInput v-model.number="targetW" type="number" suffix="px" />
                </UFormGroup>
                <UFormGroup
                  v-if="['custom', 'auto-width'].includes(mode)"
                  label="Height"
                >
                  <UInput v-model.number="targetH" type="number" suffix="px" />
                </UFormGroup>
              </div>

              <UButton
                block
                color="primary"
                size="lg"
                icon="i-heroicons-arrow-down-tray"
                :loading="busy"
                @click="download"
              >
                Download
              </UButton>
            </div>
          </UCard>
        </div>
      </div>

      <div class="flex-1 space-y-6">
        <UCard
          v-if="!items.length"
          class="border-2 border-dashed min-h-100 flex items-center justify-center transition-all"
          :class="
            dragging
              ? 'border-primary-500 bg-primary-500/10'
              : 'border-base-800 bg-base-900/30'
          "
          @dragover.prevent="dragging = true"
          @dragleave.prevent="dragging = false"
          @drop.prevent="handleDrop"
          @click="picker?.click()"
        >
          <div
            class="flex flex-col items-center justify-center p-12 text-center outline-none"
          >
            <UIcon
              name="i-heroicons-photo"
              class="w-16 h-16 text-base-600 mb-4"
            />
            <h3 class="text-lg font-medium text-white mb-2">
              Drop images here
            </h3>
            <p class="text-base-500">
              Supports multiple JPG, PNG, and WebP files.
            </p>
          </div>
        </UCard>

        <div
          v-else
          class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          <div
            class="border-2 border-dashed border-base-800 rounded-xl bg-base-900/20 flex flex-col items-center justify-center min-h-62.5 hover:border-base-700 hover:bg-base-900/40 transition-all group"
            role="button"
            @click="picker?.click()"
          >
            <UIcon
              name="i-heroicons-plus-circle"
              class="w-10 h-10 text-base-700 group-hover:text-base-500 transition-colors"
            />
            <span
              class="text-sm font-medium text-base-600 group-hover:text-base-400 mt-2"
              >Add more</span
            >
          </div>

          <UCard
            v-for="item in items"
            :key="item.id"
            class="border border-base-800 bg-base-900/50 flex flex-col overflow-hidden"
            :ui="{ body: { padding: 'p-0' } }"
          >
            <div
              class="flex items-center justify-center p-3 border-b border-base-800 bg-base-900/80 text-xs font-medium text-white truncate"
            >
              {{ item.name }}
            </div>
            <div
              class="relative w-full bg-base-950 overflow-hidden select-none flex items-center justify-center min-h-50"
            >
              <div
                class="relative w-full"
                :class="{
                  'cursor-move touch-none':
                    isCropping && (getPan(item).canX || getPan(item).canY),
                }"
                @pointerdown.prevent="drag($event, item)"
              >
                <img
                  :src="item.url"
                  class="w-full h-auto block pointer-events-none"
                />
                <div
                  v-if="isCropping && (getPan(item).canX || getPan(item).canY)"
                  class="absolute border border-primary-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]"
                  :style="getCropStyle(item)"
                />
              </div>
            </div>
            <div
              class="p-3 border-t border-base-800 bg-base-900/80 flex items-center justify-center text-[10px] text-base-500 font-mono"
            >
              {{ item.w }}x{{ item.h }} to {{ getDimensions(item).w }}x{{
                getDimensions(item).h
              }}
            </div>
          </UCard>
        </div>
      </div>
    </div>
  </div>
</template>
