<script setup lang="ts">
interface WheelItem {
  id: string;
  label: string;
  color: string;
  weight: number;
}

const palette = [
  'var(--color-primary-400)',
  'var(--color-accent-500)',
  'var(--color-success-500)',
  'var(--color-warning-500)',
  'var(--color-error-500)',
  'var(--color-primary-700)',
  'var(--color-accent-300)',
  'var(--color-primary-600)',
];

let colorCursor = 0;
function nextColor(): string {
  return palette[colorCursor++ % palette.length]!;
}

function makeItem(label: string): WheelItem {
  return { id: crypto.randomUUID(), label, color: nextColor(), weight: 1 };
}

const items = ref<WheelItem[]>([makeItem('Yes'), makeItem('No')]);

const inputText = ref('');
const rotation = ref(0);
const isSpinning = ref(false);
const winner = ref<WheelItem | null>(null);

const totalWeight = computed(() =>
  items.value.reduce((sum, i) => sum + i.weight, 0),
);
const canSpin = computed(() => items.value.length >= 2 && !isSpinning.value);

interface Slice {
  item: WheelItem;
  startAngle: number;
  endAngle: number;
  midAngle: number;
  angle: number;
}

const slices = computed<Slice[]>(() => {
  if (totalWeight.value === 0) return [];
  const result: Slice[] = [];
  let cumAngle = 0;
  for (const item of items.value) {
    const angle = (item.weight / totalWeight.value) * 360;
    result.push({
      item,
      startAngle: cumAngle,
      endAngle: cumAngle + angle,
      midAngle: cumAngle + angle / 2,
      angle,
    });
    cumAngle += angle;
  }
  return result;
});

const textSlices = computed(() => slices.value.filter((s) => s.angle >= 14));

const wheelStyle = computed(() => ({
  transform: `rotate(${rotation.value}deg)`,
  transformOrigin: '200px 200px',
  transition: isSpinning.value
    ? 'transform 4s cubic-bezier(0.23, 1, 0.32, 1)'
    : 'none',
}));

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}

function slicePath(startAngle: number, endAngle: number): string {
  const cx = 200,
    cy = 200,
    r = 180;
  if (endAngle - startAngle >= 359.99) {
    return `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} A ${r} ${r} 0 0 1 ${cx} ${cy - r} Z`;
  }
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

function textPos(midAngle: number, radius = 120) {
  return polarToCartesian(200, 200, radius, midAngle);
}

function resolveWinner(totalRotation: number): WheelItem {
  const normalised = (360 - (totalRotation % 360)) % 360;
  let cumulative = 0;
  for (const item of items.value) {
    cumulative += (item.weight / totalWeight.value) * 360;
    if (normalised < cumulative) return item;
  }
  return items.value[0]!;
}

async function spin() {
  if (!canSpin.value) return;
  winner.value = null;
  isSpinning.value = true;
  const extraSpins = 5 + Math.random() * 5;
  const extraDegrees = Math.random() * 360;
  const target = rotation.value + extraSpins * 360 + extraDegrees;
  await nextTick();
  rotation.value = target;
  setTimeout(() => {
    isSpinning.value = false;
    winner.value = resolveWinner(target);
  }, 4100);
}

function addItem(label = 'Option') {
  items.value.push(makeItem(label));
}

function removeItem(id: string) {
  items.value = items.value.filter((i) => i.id !== id);
}

function shuffle() {
  const arr = [...items.value];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  items.value = arr;
}

function commitInput() {
  const text = inputText.value.trim();
  if (!text) return;
  for (const line of text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)) {
    items.value.push(makeItem(line));
  }
  inputText.value = '';
}

function handlePaste(e: ClipboardEvent) {
  const text = e.clipboardData?.getData('text') ?? '';
  if (!text.includes('\n')) return;
  e.preventDefault();
  for (const line of text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)) {
    items.value.push(makeItem(line));
  }
  inputText.value = '';
}

function labelForSvg(label: string): string {
  return label.length > 12 ? label.slice(0, 11) + '…' : label;
}

function fontSize(label: string, sliceAngle: number): number {
  const angleBase = Math.min(1, sliceAngle / 45);
  const size = 15 * angleBase;
  const lengthFactor = label.length > 8 ? 0.75 : label.length > 5 ? 0.88 : 1;
  return Math.max(7, Math.round(size * lengthFactor));
}

function labelRectWidth(label: string, sliceAngle: number): number {
  const fs = fontSize(label, sliceAngle);
  return Math.round(fs * 0.62 * labelForSvg(label).length) + 10;
}
</script>

<template>
  <div class="space-y-6 max-w-6xl mx-auto">
    <div class="space-y-2">
      <h1 class="text-2xl md:text-3xl font-bold text-highlighted text-balance">
        Decision Roulette
      </h1>
      <p class="text-muted text-pretty">
        Add your options, spin the wheel, let fate decide.
      </p>
    </div>

    <div
      class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start"
    >
      <UCard class="border-0" variant="outline">
        <div class="flex flex-col items-center gap-6 py-2">
          <div
            class="relative w-full max-w-sm mx-auto aspect-square select-none"
          >
            <svg
              viewBox="0 0 400 400"
              class="w-full h-full"
              role="img"
              :aria-label="`Spinning wheel with ${items.length} options`"
            >
              <g :style="wheelStyle">
                <path
                  v-for="slice in slices"
                  :key="'p-' + slice.item.id"
                  :d="slicePath(slice.startAngle, slice.endAngle)"
                  :fill="slice.item.color"
                  stroke="rgba(0,0,0,0.2)"
                  stroke-width="1.5"
                />
                <g
                  v-for="slice in textSlices"
                  :key="'t-' + slice.item.id"
                  :transform="`rotate(${slice.midAngle}, ${textPos(slice.midAngle).x}, ${textPos(slice.midAngle).y})`"
                  style="pointer-events: none"
                >
                  <rect
                    :x="
                      textPos(slice.midAngle).x -
                      labelRectWidth(slice.item.label, slice.angle) / 2
                    "
                    :y="
                      textPos(slice.midAngle).y -
                      fontSize(slice.item.label, slice.angle) / 2 -
                      3
                    "
                    :width="labelRectWidth(slice.item.label, slice.angle)"
                    :height="fontSize(slice.item.label, slice.angle) + 6"
                    fill="black"
                    opacity="0.5"
                    rx="2"
                  />
                  <text
                    :x="textPos(slice.midAngle).x"
                    :y="textPos(slice.midAngle).y"
                    :font-size="fontSize(slice.item.label, slice.angle)"
                    fill="white"
                    text-anchor="middle"
                    dominant-baseline="middle"
                    font-family="Recursive, sans-serif"
                    font-weight="700"
                    letter-spacing="0.06em"
                  >
                    {{ labelForSvg(slice.item.label) }}
                  </text>
                </g>
              </g>

              <circle
                cx="200"
                cy="200"
                r="180"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                stroke-width="2"
              />

              <polygon
                points="191,10 209,10 200,30"
                fill="white"
                opacity="0.92"
              />

              <circle
                cx="200"
                cy="200"
                r="46"
                fill="hsl(0,0%,5%)"
                stroke="rgba(255,255,255,0.12)"
                stroke-width="2"
                :class="canSpin ? 'cursor-pointer' : 'cursor-not-allowed'"
                @click="spin"
              />
              <text
                x="200"
                y="200"
                text-anchor="middle"
                dominant-baseline="middle"
                font-size="12"
                font-weight="700"
                letter-spacing="0.12em"
                font-family="Recursive, sans-serif"
                :fill="canSpin ? 'white' : 'rgba(255,255,255,0.3)'"
                style="pointer-events: none"
              >
                SPIN
              </text>
            </svg>
          </div>

          <div v-if="winner" class="text-center space-y-1">
            <p class="text-sm text-muted">Result</p>
            <div class="flex items-center justify-center gap-2">
              <span class="size-3 rounded-full shrink-0" :style="{ backgroundColor: winner.color }" />
              <span class="text-xl font-bold text-highlighted">{{ winner.label }}</span>
            </div>
          </div>

          <p v-if="items.length < 2" class="text-sm text-dimmed text-center">
            Add at least 2 items.
          </p>
        </div>
      </UCard>

      <UCard class="border border-default bg-muted/50 lg:sticky lg:top-4">
        <div class="space-y-0.5 max-h-80 overflow-y-auto">
          <div
            v-for="item in items"
            :key="item.id"
            class="group flex items-center gap-1.5 rounded px-1 py-0.5 hover:bg-elevated/50 transition-colors"
          >
            <label
              class="size-5 rounded-sm cursor-pointer shrink-0 border border-accented block"
              :style="{ backgroundColor: item.color }"
              :title="`Change color for ${item.label}`"
            >
              <input
                type="color"
                :value="item.color"
                class="sr-only"
                @input="
                  (e) => {
                    item.color = (e.target as HTMLInputElement).value;
                  }
                "
              />
            </label>

            <UInput
              v-model="item.label"
              variant="soft"
              class="flex-1 min-w-0"
              aria-label="Item label"
            />

            <UInput
              v-model.number="item.weight"
              type="number"
              min="1"
              max="10"
              variant="soft"
              class="w-14 shrink-0"
              :aria-label="`Weight for ${item.label}`"
            />

            <UButton
              icon="i-heroicons-trash"
              variant="ghost"
              color="error"
              size="xs"
              class="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
              :aria-label="`Remove ${item.label}`"
              @click="removeItem(item.id)"
            />
          </div>
        </div>

        <UButton
          variant="outline"
          color="neutral"
          block
          icon="i-heroicons-plus"
          size="sm"
          class="mt-3"
          @click="addItem()"
        >
          Add item
        </UButton>

        <UButton
          block
          size="xl"
          :disabled="!canSpin"
          class="mt-4 lg:hidden"
          @click="spin"
        >
          {{ isSpinning ? 'Spinning…' : 'Spin the wheel' }}
        </UButton>
      </UCard>
    </div>
  </div>
</template>
