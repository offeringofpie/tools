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
</script>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

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

// Decouples the live input from the strictly formatted model while typing
const activeEditId = ref<string | null>(null);
const activeEditText = ref<string>('');

const handleFocus = (id: string, currentFormatted: string) => {
  activeEditId.value = id;
  activeEditText.value = currentFormatted;
};

const handleInput = (i: number, val: string) => {
  activeEditText.value = val;
  const newHex = parseInputToHex(val);
  if (newHex) {
    colors.value[i].hex = newHex;
  }
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

onMounted(() => document.addEventListener('keydown', onSpace));
onUnmounted(() => document.removeEventListener('keydown', onSpace));
</script>

<template>
  <div class="space-y-6 max-w-screen mx-auto">
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
        <UButton aria-label="Generate new color palette" @click="generate"
          >Generate</UButton
        >
      </div>
    </div>

    <div
      class="flex flex-col md:flex-row h-[40vh] min-h-100 w-full rounded-2xl overflow-y-auto md:overflow-x-auto md:overflow-y-hidden shadow-2xl border border-base-800 bg-base-900 custom-scrollbar"
      role="list"
      aria-label="Color swatches"
    >
      <div
        v-for="(c, i) in colors"
        :key="c.id"
        class="flex-1 flex flex-col items-center justify-end md:justify-center p-2 transition-colors duration-300 group relative min-h-25 md:min-h-0 md:min-w-37.5"
        :style="{ backgroundColor: c.hex }"
        role="listitem"
      >
        <div
          class="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100 pointer-events-none"
        >
          <div
            class="flex flex-col md:flex-row lg:flex-col items-center gap-2 md:gap-4 z-10 pointer-events-auto"
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
            class="absolute inset-x-0 top-0 h-1/4 flex items-center justify-center md:inset-y-0 md:inset-x-auto md:left-0 md:w-1/4 md:h-full max-w-10 max-h-10 md:max-h-none mx-auto md:mx-0 pointer-events-auto"
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
            class="absolute inset-x-0 bottom-0 h-1/4 flex items-center justify-center md:inset-y-0 md:inset-x-auto md:right-0 md:w-1/4 md:h-full max-w-10 max-h-10 md:max-h-none mx-auto md:mx-0 pointer-events-auto"
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

        <div
          class="group/input absolute bottom-2 md:static md:mt-auto md:mb-8 z-20 w-full px-2"
        >
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
                    : `Copy color ${parseColor(c.hex, format)} to clipboard`
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
