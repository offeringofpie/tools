<script lang="ts">
export function randomHEX(): string {
  return (
    '#' +
    Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, '0')
      .toUpperCase()
  );
}

export function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function blendHEX(h1: string, h2: string): string {
  const c1 = hexToRgb(h1);
  const c2 = hexToRgb(h2);
  const r = Math.round((c1.r + c2.r) / 2);
  const g = Math.round((c1.g + c2.g) / 2);
  const b = Math.round((c1.b + c2.b) / 2);

  return (
    '#' +
    [r, g, b]
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

export function getTextColor(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128
    ? '!text-black hover:!text-black focus:!text-black placeholder:!text-black/50'
    : '!text-white hover:!text-white focus:!text-white placeholder:!text-white/50';
}

export function parseInputToHex(input: string): string | null {
  const str = input.trim().toLowerCase();

  if (/^#?([0-9a-f]{3}|[0-9a-f]{6})$/.test(str)) {
    let hex = str.startsWith('#') ? str : '#' + str;
    if (hex.length === 4) {
      hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    }
    return hex.toUpperCase();
  }

  const rgbMatch = str.match(
    /^rgb\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/,
  );
  if (rgbMatch) {
    const r = Math.min(255, Math.max(0, Math.round(parseFloat(rgbMatch[1]))));
    const g = Math.min(255, Math.max(0, Math.round(parseFloat(rgbMatch[2]))));
    const b = Math.min(255, Math.max(0, Math.round(parseFloat(rgbMatch[3]))));
    return (
      '#' +
      [r, g, b]
        .map((x) => x.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase()
    );
  }

  const hslMatch = str.match(
    /^hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*\)$/,
  );
  if (hslMatch) {
    let h = parseFloat(hslMatch[1]) % 360;
    if (h < 0) h += 360;
    const s = Math.min(100, Math.max(0, parseFloat(hslMatch[2]))) / 100;
    const l = Math.min(100, Math.max(0, parseFloat(hslMatch[3]))) / 100;

    const a = s * Math.min(l, 1 - l);
    const f = (n: number, k = (n + h / 30) % 12) =>
      l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));

    const r = Math.round(f(0) * 255);
    const g = Math.round(f(8) * 255);
    const b = Math.round(f(4) * 255);
    return (
      '#' +
      [r, g, b]
        .map((x) => x.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase()
    );
  }

  return null;
}

export function parseColor(hex: string, format: string): string {
  if (format === 'hex') return hex.toUpperCase();

  const { r, g, b } = hexToRgb(hex);
  if (format === 'rgb') return `rgb(${r}, ${g}, ${b})`;

  const rN = r / 255;
  const gN = g / 255;
  const bN = b / 255;

  const max = Math.max(rN, gN, bN);
  const min = Math.min(rN, gN, bN);
  const d = max - min;
  let h = 0;

  if (d !== 0) {
    if (max === rN) h = (gN - bN) / d + (gN < bN ? 6 : 0);
    else if (max === gN) h = (bN - rN) / d + 2;
    else h = (rN - gN) / d + 4;
    h /= 6;
  }

  if (format === 'hsl') {
    const l = (max + min) / 2;
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  }

  if (format === 'hsv') {
    const s = max === 0 ? 0 : d / max;
    return `hsv(${(h * 360).toFixed(1)}, ${(s * 100).toFixed(1)}%, ${(max * 100).toFixed(1)}%)`;
  }

  const lin = (c: number) =>
    c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92;
  const lr = lin(rN);
  const lg = lin(gN);
  const lb = lin(bN);

  if (format === 'lab') {
    const x = (0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb) / 0.95047;
    const y = 0.2126729 * lr + 0.7151522 * lg + 0.072175 * lb;
    const z = (0.0193339 * lr + 0.119192 * lg + 0.9503041 * lb) / 1.08883;

    const f = (t: number) =>
      t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
    const lStar = 116 * f(y) - 16;
    const aStar = 500 * (f(x) - f(y));
    const bStar = 200 * (f(y) - f(z));

    return `lab(${lStar.toFixed(2)} ${aStar.toFixed(2)} ${bStar.toFixed(2)})`;
  }

  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const b_ok = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  if (format === 'oklab') {
    return `oklab(${L.toFixed(4)} ${a.toFixed(4)} ${b_ok.toFixed(4)})`;
  }

  if (format === 'oklch') {
    const C = Math.sqrt(a * a + b_ok * b_ok);
    let H = Math.atan2(b_ok, a) * (180 / Math.PI);
    if (H < 0) H += 360;
    return `oklch(${L.toFixed(4)} ${C.toFixed(4)} ${H.toFixed(1)})`;
  }

  return hex;
}

const toLinear = (channel: number) => {
  const c = channel / 255;
  return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92;
};

const byteToHex = (n: number) =>
  Math.max(0, Math.min(255, Math.round(n)))
    .toString(16)
    .padStart(2, '0');

const rgbToHex = (r: number, g: number, b: number) =>
  ('#' + byteToHex(r) + byteToHex(g) + byteToHex(b)).toUpperCase();

const Xn = 0.95047;
const Zn = 1.08883;

const labF = (t: number) =>
  t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;

function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  const rLin = toLinear(r);
  const gLin = toLinear(g);
  const bLin = toLinear(b);

  const x = (0.4124564 * rLin + 0.3575761 * gLin + 0.1804375 * bLin) / Xn;
  const y = 0.2126729 * rLin + 0.7151522 * gLin + 0.072175 * bLin;
  const z = (0.0193339 * rLin + 0.119192 * gLin + 0.9503041 * bLin) / Zn;

  const fx = labF(x),
    fy = labF(y),
    fz = labF(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

function hueOfHex(hex: string): number {
  const GREY_HUE = 360;
  const { r, g, b } = hexToRgb(hex);
  const [rN, gN, bN] = [r / 255, g / 255, b / 255];

  const max = Math.max(rN, gN, bN);
  const min = Math.min(rN, gN, bN);
  const chroma = max - min;

  if (chroma < 0.04) return GREY_HUE;

  let sector: number;
  if (max === rN) sector = ((gN - bN) / chroma) % 6;
  else if (max === gN) sector = (bN - rN) / chroma + 2;
  else sector = (rN - gN) / chroma + 4;

  return (sector * 60 + 360) % 360;
}

async function loadImageBitmap(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function samplePixels(img: HTMLImageElement, maxSide = 100) {
  const scale = Math.min(
    1,
    maxSide / Math.max(img.naturalWidth, img.naturalHeight),
  );
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas unavailable');
  ctx.drawImage(img, 0, 0, w, h);

  const { data } = ctx.getImageData(0, 0, w, h);
  const rgb: [number, number, number][] = [];
  const lab: [number, number, number][] = [];

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    rgb.push([r, g, b]);
    lab.push(rgbToLab(r, g, b));
  }
  return { rgb, lab };
}

const sqDistance = (a: number[], b: number[]) => {
  const d0 = a[0] - b[0],
    d1 = a[1] - b[1],
    d2 = a[2] - b[2];
  return d0 * d0 + d1 * d1 + d2 * d2;
};

function seedCentroids(points: [number, number, number][], k: number) {
  const seeds: [number, number, number][] = [
    [...points[Math.floor(Math.random() * points.length)]],
  ];

  while (seeds.length < k) {
    const weights = points.map((p) =>
      Math.min(...seeds.map((s) => sqDistance(p, s))),
    );
    const total = weights.reduce((a, b) => a + b, 0);
    if (total === 0) break;

    let r = Math.random() * total;
    const pick = weights.findIndex((w) => (r -= w) <= 0);
    seeds.push([...points[pick < 0 ? 0 : pick]]);
  }
  return seeds;
}

function runKMeans(
  points: [number, number, number][],
  centroids: [number, number, number][],
  maxIterations = 12,
) {
  const labels = new Int32Array(points.length);

  for (let iter = 0; iter < maxIterations; iter++) {
    let moved = false;

    for (let i = 0; i < points.length; i++) {
      let best = 0,
        bestDist = Infinity;
      for (let c = 0; c < centroids.length; c++) {
        const d = sqDistance(points[i], centroids[c]);
        if (d < bestDist) {
          bestDist = d;
          best = c;
        }
      }
      if (labels[i] !== best) {
        labels[i] = best;
        moved = true;
      }
    }

    const sums = centroids.map(() => [0, 0, 0, 0]);
    for (let i = 0; i < points.length; i++) {
      const s = sums[labels[i]],
        p = points[i];
      s[0] += p[0];
      s[1] += p[1];
      s[2] += p[2];
      s[3]++;
    }
    for (let c = 0; c < centroids.length; c++) {
      if (sums[c][3] > 0) {
        centroids[c] = [
          sums[c][0] / sums[c][3],
          sums[c][1] / sums[c][3],
          sums[c][2] / sums[c][3],
        ];
      }
    }

    if (!moved) break;
  }
  return labels;
}

export async function extractPalette(
  src: string | Blob,
  k: number,
): Promise<string[]> {
  const url = typeof src === 'string' ? src : URL.createObjectURL(src);
  try {
    const img = await loadImageBitmap(url);
    const { rgb, lab } = samplePixels(img);
    if (lab.length === 0) return [];

    const clusters = Math.max(1, Math.min(k, lab.length));
    const centroids = seedCentroids(lab, clusters);
    const labels = runKMeans(lab, centroids);

    const swatches = centroids
      .map((centroid, c) => {
        let nearest = -1,
          nearestDist = Infinity;
        for (let i = 0; i < lab.length; i++) {
          if (labels[i] !== c) continue;
          const d = sqDistance(lab[i], centroid);
          if (d < nearestDist) {
            nearestDist = d;
            nearest = i;
          }
        }
        return nearest >= 0 ? rgbToHex(...rgb[nearest]) : null;
      })
      .filter((hex): hex is string => hex !== null);

    return [...new Set(swatches)].sort((a, b) => hueOfHex(a) - hueOfHex(b));
  } finally {
    if (typeof src !== 'string') URL.revokeObjectURL(url);
  }
}
</script>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, onBeforeUnmount } from 'vue';

interface Color {
  id: string;
  hex: string;
  locked: boolean;
}

const copied = ref<string | null>(null);
const limit = 20;

const format = ref('hex');
const formats = [
  { label: 'HEX', value: 'hex' },
  { label: 'RGB', value: 'rgb' },
  { label: 'HSL', value: 'hsl' },
  { label: 'HSV', value: 'hsv' },
  { label: 'LAB', value: 'lab' },
  { label: 'OKLAB', value: 'oklab' },
  { label: 'OKLCH', value: 'oklch' },
];

const colors = ref<Color[]>(
  Array.from({ length: 5 }, () => ({
    id: crypto.randomUUID(),
    hex: randomHEX(),
    locked: false,
  })),
);

const activeEditId = ref<string | null>(null);
const activeEditText = ref<string>('');

const handleFocus = (id: string, currentFormatted: string) => {
  activeEditId.value = id;
  activeEditText.value = currentFormatted;
};

const handleInput = (i: number, val: string) => {
  activeEditText.value = val;
  const newHex = parseInputToHex(val);
  if (newHex) colors.value[i].hex = newHex;
};

const handleBlur = () => {
  activeEditId.value = null;
};

const generate = () => {
  colors.value = colors.value.map((c) =>
    c.locked ? c : { ...c, hex: randomHEX() },
  );
};

const generateSingle = (i: number) => {
  if (!colors.value[i].locked) colors.value[i].hex = randomHEX();
};

const addSwatch = (i: number) => {
  if (colors.value.length >= limit) return;

  const left = colors.value[i - 1]?.hex;
  const right = colors.value[i]?.hex;

  let hex = randomHEX();
  if (left && right) hex = blendHEX(left, right);
  else if (left) hex = blendHEX(left, randomHEX());
  else if (right) hex = blendHEX(right, randomHEX());

  colors.value.splice(i, 0, { id: crypto.randomUUID(), hex, locked: false });
};

const deleteSwatch = (i: number) => {
  if (colors.value.length > 2) colors.value.splice(i, 1);
};

const lock = (i: number) => {
  colors.value[i].locked = !colors.value[i].locked;
};

const copy = async (id: string, textToCopy: string) => {
  try {
    await navigator.clipboard.writeText(textToCopy);
    copied.value = id;
    setTimeout(() => {
      if (copied.value === id) copied.value = null;
    }, 1500);
  } catch (err) {
    console.error('Copy failed', err);
  }
};

const onSpace = (e: KeyboardEvent) => {
  if (e.code === 'Space' && e.target === document.body) {
    e.preventDefault();
    generate();
  }
};

const extractOpen = ref(false);
const extractFileInput = ref<HTMLInputElement | null>(null);
const imgPreview = ref<string | null>(null);
const extractFileName = ref<string | null>(null);

const unlockedCount = computed(
  () => colors.value.filter((c) => !c.locked).length,
);

function resetExtract() {
  if (imgPreview.value) URL.revokeObjectURL(imgPreview.value);
  imgPreview.value = null;
  extractFileName.value = null;
}

function onExtractFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const f = input.files?.[0];
  if (f) loadExtractFile(f);
}

function onExtractDrop(e: DragEvent) {
  e.preventDefault();
  const f = e.dataTransfer?.files?.[0];
  if (f) loadExtractFile(f);
}

function loadExtractFile(f: File) {
  if (!f.type.startsWith('image/')) {
    return;
  }
  resetExtract();
  imgPreview.value = URL.createObjectURL(f);
  extractFileName.value = f.name;
  extractImage();
}

function handlePaste(e: ClipboardEvent) {
  const f = e.clipboardData?.files[0] ?? e.clipboardData?.items[0]?.getAsFile();
  if (!f?.type.startsWith('image/')) return;

  e.preventDefault();
  resetExtract();
  imgPreview.value = URL.createObjectURL(f);
  extractFileName.value = f.name;
  extractImage();
}
onMounted(() => window.addEventListener('paste', handlePaste));
onBeforeUnmount(() => {
  URL.revokeObjectURL(imgPreview);
  window.removeEventListener('paste', handlePaste);
});

async function extractImage() {
  if (!imgPreview.value) return;
  if (unlockedCount.value === 0) {
    return;
  }
  try {
    const palette = await extractPalette(imgPreview.value, unlockedCount.value);
    if (palette.length === 0) {
      return;
    }
    applyExtracted(palette);
  } catch (e) {}
}

function applyExtracted(palette: string[]) {
  const available = palette.slice();
  const existing = colors.value.slice();
  const result: Color[] = [];
  let paletteIdx = 0;

  for (const c of existing) {
    if (c.locked) {
      result.push(c);
    } else if (paletteIdx < available.length) {
      result.push({ ...c, hex: available[paletteIdx++] });
    } else {
      result.push(c);
    }
  }

  colors.value = result;
}

onMounted(() => document.addEventListener('keydown', onSpace));
onUnmounted(() => document.removeEventListener('keydown', onSpace));
onBeforeUnmount(() => {
  if (imgPreview.value) URL.revokeObjectURL(imgPreview.value);
});
</script>

<template>
  <div class="space-y-6">
    <div
      class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
    >
      <div>
        <h1 class="text-2xl md:text-3xl font-bold text-white mb-2">
          Colour Palette
        </h1>
        <p class="text-base-400">Press <UKbd>Space</UKbd> to generate.</p>
      </div>

      <div class="flex items-center gap-3 w-full md:w-auto">
        <USelect
          v-model="format"
          :items="formats"
          icon="i-heroicons-swatch"
          color="neutral"
          variant="subtle"
          aria-label="Color format"
          class="flex-1 md:flex-none md:w-36 font-mono"
        />

        <UPopover v-model:open="extractOpen" :ui="{ content: 'w-80 p-4' }">
          <UButton
            icon="i-heroicons-photo"
            color="neutral"
            variant="subtle"
            aria-label="Extract palette from image"
          >
            From image
          </UButton>

          <template #content>
            <div class="space-y-3">
              <div
                v-if="!imgPreview"
                class="border-2 border-dashed border-base-700 rounded-lg p-4 text-center hover:border-primary-500 transition-colors cursor-pointer mb-0"
                role="button"
                tabindex="0"
                aria-label="Upload an image"
                @click="extractFileInput?.click()"
                @keydown.enter.prevent="extractFileInput?.click()"
                @keydown.space.prevent="extractFileInput?.click()"
                @dragover.prevent
                @drop="onExtractDrop"
              >
                <UIcon
                  name="i-heroicons-photo"
                  class="size-5 text-base-500 mx-auto mb-1"
                />
                <p class="text-xs text-base-400">Choose an image</p>
              </div>

              <div v-else class="space-y-3">
                <div class="relative rounded-lg overflow-hidden">
                  <img
                    :src="imgPreview"
                    alt="image to extract"
                    class="w-full aspect-auto object-cover"
                  />
                  <UButton
                    icon="i-heroicons-x-mark"
                    color="neutral"
                    variant="solid"
                    size="xs"
                    class="absolute top-1 right-1"
                    aria-label="Remove image"
                    @click="resetExtract"
                  />
                </div>
              </div>

              <input
                ref="extractFileInput"
                type="file"
                accept="image/*"
                class="hidden"
                @change="onExtractFileChange"
              />
            </div>
          </template>
        </UPopover>

        <UButton aria-label="Generate new color palette" @click="generate"
          >Generate</UButton
        >
      </div>
    </div>

    <div
      class="flex flex-col gap-2 md:hidden"
      role="list"
      aria-label="Color swatches"
    >
      <div
        v-for="(c, i) in colors"
        :key="c.id"
        class="relative flex items-center rounded-xl overflow-hidden min-h-16 transition-colors duration-300"
        :style="{ backgroundColor: c.hex }"
        role="listitem"
      >
        <div class="flex-1 flex items-center px-4 py-3 min-w-0">
          <div class="group/input flex-1 min-w-0">
            <UInput
              :model-value="
                activeEditId === c.id
                  ? activeEditText
                  : parseColor(c.hex, format)
              "
              variant="none"
              :ui="{
                base: `font-mono font-bold bg-transparent !opacity-100 ${getTextColor(c.hex)}`,
              }"
              :aria-label="`Edit color value for swatch ${i + 1}`"
              @focus="handleFocus(c.id, parseColor(c.hex, format))"
              @update:model-value="(val) => handleInput(i, val)"
              @blur="handleBlur"
            >
              <template #trailing>
                <UButton
                  :icon="
                    copied === c.id
                      ? 'i-heroicons-check'
                      : 'i-heroicons-document-duplicate'
                  "
                  variant="ghost"
                  size="xs"
                  :class="getTextColor(c.hex)"
                  :padded="false"
                  :aria-label="
                    copied === c.id
                      ? 'Copied!'
                      : `Copy ${parseColor(c.hex, format)}`
                  "
                  @click="copy(c.id, parseColor(c.hex, format))"
                />
              </template>
            </UInput>
          </div>
        </div>

        <div
          class="flex items-center gap-1 px-2 shrink-0"
          role="group"
          :aria-label="`Controls for swatch ${i + 1}`"
        >
          <UButton
            v-if="!c.locked"
            icon="i-heroicons-arrow-path"
            variant="ghost"
            size="sm"
            :class="getTextColor(c.hex)"
            :aria-label="`Regenerate swatch ${i + 1}`"
            @click="generateSingle(i)"
          />
          <UButton
            :icon="
              c.locked ? 'i-heroicons-lock-closed' : 'i-heroicons-lock-open'
            "
            variant="ghost"
            size="sm"
            :class="getTextColor(c.hex)"
            :aria-label="
              c.locked ? `Unlock swatch ${i + 1}` : `Lock swatch ${i + 1}`
            "
            :aria-pressed="c.locked"
            @click="lock(i)"
          />
          <UButton
            v-if="colors.length > 2"
            icon="i-heroicons-x-mark"
            variant="ghost"
            size="sm"
            :class="getTextColor(c.hex)"
            :aria-label="`Remove swatch ${i + 1}`"
            @click="deleteSwatch(i)"
          />
          <UButton
            v-if="colors.length < limit"
            icon="i-heroicons-plus"
            variant="ghost"
            size="sm"
            :class="getTextColor(c.hex)"
            :aria-label="`Add swatch after ${i + 1}`"
            @click="addSwatch(i + 1)"
          />
        </div>
      </div>
    </div>

    <div
      class="hidden md:flex h-[40vh] min-h-100 w-full rounded-2xl overflow-x-auto overflow-y-hidden shadow-2xl border border-base-800 bg-base-900 custom-scrollbar"
      role="list"
      aria-label="Color swatches"
    >
      <div
        v-for="(c, i) in colors"
        :key="c.id"
        class="flex-1 flex flex-col items-center justify-center p-2 transition-colors duration-300 group relative min-w-37.5"
        :style="{ backgroundColor: c.hex }"
        role="listitem"
      >
        <div
          class="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100 pointer-events-none"
        >
          <div
            class="flex lg:flex-col items-center gap-2 z-10 pointer-events-auto"
            role="group"
            :aria-label="`Controls for swatch ${i + 1}`"
          >
            <UButton
              :icon="
                c.locked ? 'i-heroicons-lock-closed' : 'i-heroicons-lock-open'
              "
              variant="ghost"
              :class="getTextColor(c.hex)"
              :aria-label="
                c.locked ? `Unlock swatch ${i + 1}` : `Lock swatch ${i + 1}`
              "
              :aria-pressed="c.locked"
              @click="lock(i)"
            />
            <UButton
              v-if="!c.locked"
              icon="i-heroicons-arrow-path"
              variant="ghost"
              :class="getTextColor(c.hex)"
              :aria-label="`Generate new color for swatch ${i + 1}`"
              @click="generateSingle(i)"
            />
            <UButton
              v-if="colors.length > 2"
              icon="i-heroicons-x-mark"
              variant="ghost"
              :class="getTextColor(c.hex)"
              :aria-label="`Remove swatch ${i + 1}`"
              @click="deleteSwatch(i)"
            />
          </div>

          <div
            class="absolute inset-y-0 left-0 w-1/4 flex items-center justify-center pointer-events-auto"
          >
            <UButton
              v-if="colors.length < limit"
              icon="i-heroicons-plus"
              variant="ghost"
              :class="getTextColor(c.hex)"
              :aria-label="`Add new color before swatch ${i + 1}`"
              @click="addSwatch(i)"
            />
          </div>

          <div
            class="absolute inset-y-0 right-0 w-1/4 flex items-center justify-center pointer-events-auto"
          >
            <UButton
              v-if="colors.length < limit"
              icon="i-heroicons-plus"
              variant="ghost"
              :class="getTextColor(c.hex)"
              :aria-label="`Add new color after swatch ${i + 1}`"
              @click="addSwatch(i + 1)"
            />
          </div>
        </div>

        <div class="mt-auto mb-8 z-20 w-full px-2 group/input">
          <UInput
            :model-value="
              activeEditId === c.id ? activeEditText : parseColor(c.hex, format)
            "
            variant="none"
            :ui="{
              base: `text-center font-mono font-bold bg-transparent transition-colors !opacity-100 ${getTextColor(c.hex)}`,
            }"
            :aria-label="`Edit color value for swatch ${i + 1}`"
            @focus="handleFocus(c.id, parseColor(c.hex, format))"
            @update:model-value="(val) => handleInput(i, val)"
            @blur="handleBlur"
          >
            <template #trailing>
              <UButton
                :icon="
                  copied === c.id
                    ? 'i-heroicons-check'
                    : 'i-heroicons-document-duplicate'
                "
                variant="ghost"
                class="transition-opacity"
                :class="[
                  getTextColor(c.hex),
                  copied === c.id
                    ? 'opacity-100'
                    : 'opacity-0 focus-within:opacity-100 group-hover/input:opacity-100',
                ]"
                size="xs"
                :aria-label="
                  copied === c.id
                    ? 'Color copied to clipboard'
                    : `Copy ${parseColor(c.hex, format)}`
                "
                :padded="false"
                @click="copy(c.id, parseColor(c.hex, format))"
              />
            </template>
          </UInput>
        </div>
      </div>
    </div>
  </div>
</template>
