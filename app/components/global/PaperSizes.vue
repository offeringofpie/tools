<script setup lang="ts">
import { ref, computed } from 'vue';

type Unit = 'mm' | 'cm' | 'm' | 'in' | 'pt' | 'pc' | 'px300' | 'px150' | 'px72';

const selectedItem = ref<{ label: string; value: string; series: string } | undefined>({
  label: 'A4',
  value: 'a4',
  series: 'A Series',
});
const selectedId = computed(() => selectedItem.value?.value ?? 'a4');
const activeUnit = ref<Unit>('mm');
const copied = ref<string | null>(null);

const unitItems = [
  { label: 'Millimeters (mm)', value: 'mm' },
  { label: 'Centimeters (cm)', value: 'cm' },
  { label: 'Meters (m)', value: 'm' },
  { label: 'Inches (in)', value: 'in' },
  { label: 'Points (pt)', value: 'pt' },
  { label: 'Picas (pc)', value: 'pc' },
  { label: 'px (300 dpi)', value: 'px300' },
  { label: 'px (150 dpi)', value: 'px150' },
  { label: 'px (72 dpi)', value: 'px72' },
];

const paperSelectItems = computed(() =>
  paperSeries.map((series) => [
    { type: 'label' as const, label: series.name },
    ...series.sizes.map((size) => ({ label: size.name, value: size.id, series: series.name })),
  ]),
);

const allSizes = paperSeries.flatMap((s) => s.sizes);

const selectedSize = computed(
  () => allSizes.find((s) => s.id === selectedId.value) ?? allSizes[0]!,
);

const conversions = computed(() =>
  unitItems.map(({ label, value: unit }) => ({
    unit: unit as Unit,
    label,
    value: dims(selectedSize.value.w, selectedSize.value.h, unit as Unit),
  })),
);

function fmt(mm: number, unit: Unit): string {
  switch (unit) {
    case 'mm':
      return `${mm}`;
    case 'cm':
      return (mm / 10).toFixed(1);
    case 'm':
      return (mm / 1000).toFixed(3);
    case 'in':
      return (mm / 25.4).toFixed(2);
    case 'pt':
      return (mm * 2.834645669).toFixed(1);
    case 'pc':
      return ((mm * 2.834645669) / 12).toFixed(2);
    case 'px300':
      return Math.round(mm * (300 / 25.4)).toString();
    case 'px150':
      return Math.round(mm * (150 / 25.4)).toString();
    case 'px72':
      return Math.round(mm * (72 / 25.4)).toString();
  }
}

function dims(w: number, h: number, unit: Unit): string {
  return `${fmt(w, unit)} × ${fmt(h, unit)}`;
}

function copy(id: string, text: string) {
  navigator.clipboard.writeText(text);
  copied.value = id;
  setTimeout(() => {
    if (copied.value === id) copied.value = null;
  }, 1500);
}
</script>

<script lang="ts">
interface PaperSize {
  id: string;
  name: string;
  w: number;
  h: number;
}

interface Series {
  id: string;
  name: string;
  sizes: PaperSize[];
}

export const paperSeries: Series[] = [
  {
    id: 'a',
    name: 'A Series',
    sizes: [
      { id: '4a0', name: '4A0', w: 1682, h: 2378 },
      { id: '2a0', name: '2A0', w: 1189, h: 1682 },
      { id: 'a0p', name: 'A0+', w: 914, h: 1292 },
      { id: 'a0', name: 'A0', w: 841, h: 1189 },
      { id: 'a1p', name: 'A1+', w: 609, h: 914 },
      { id: 'a1', name: 'A1', w: 594, h: 841 },
      { id: 'a2', name: 'A2', w: 420, h: 594 },
      { id: 'a3p', name: 'A3+', w: 329, h: 483 },
      { id: 'a3', name: 'A3', w: 297, h: 420 },
      {
        id: 'a4',
        name: 'A4',
        w: 210,
        h: 297,
      },
      { id: 'a5', name: 'A5', w: 148, h: 210 },
      { id: 'a6', name: 'A6', w: 105, h: 148 },
      { id: 'a7', name: 'A7', w: 74, h: 105 },
      { id: 'a8', name: 'A8', w: 52, h: 74 },
      { id: 'a9', name: 'A9', w: 37, h: 52 },
      { id: 'a10', name: 'A10', w: 26, h: 37 },
      { id: 'a11', name: 'A11', w: 18, h: 26 },
      { id: 'a12', name: 'A12', w: 13, h: 18 },
      { id: 'a13', name: 'A13', w: 9, h: 13 },
    ],
  },
  {
    id: 'b',
    name: 'B Series',
    sizes: [
      { id: 'b0p', name: 'B0+', w: 1118, h: 1580 },
      { id: 'b0', name: 'B0', w: 1000, h: 1414 },
      { id: 'b1p', name: 'B1+', w: 720, h: 1020 },
      { id: 'b1', name: 'B1', w: 707, h: 1000 },
      { id: 'b2p', name: 'B2+', w: 520, h: 720 },
      { id: 'b2', name: 'B2', w: 500, h: 707 },
      { id: 'b3', name: 'B3', w: 353, h: 500 },
      { id: 'b4', name: 'B4', w: 250, h: 353 },
      { id: 'b5', name: 'B5', w: 176, h: 250 },
      { id: 'b6', name: 'B6', w: 125, h: 176 },
      { id: 'b7', name: 'B7', w: 88, h: 125 },
      { id: 'b8', name: 'B8', w: 62, h: 88 },
      { id: 'b9', name: 'B9', w: 44, h: 62 },
      { id: 'b10', name: 'B10', w: 31, h: 44 },
      { id: 'b11', name: 'B11', w: 22, h: 31 },
      { id: 'b12', name: 'B12', w: 15, h: 22 },
      { id: 'b13', name: 'B13', w: 11, h: 15 },
    ],
  },
  {
    id: 'c',
    name: 'C Series (Envelopes)',
    sizes: [
      { id: 'c0', name: 'C0', w: 917, h: 1297 },
      { id: 'c1', name: 'C1', w: 648, h: 917 },
      { id: 'c2', name: 'C2', w: 458, h: 648 },
      { id: 'c3', name: 'C3', w: 324, h: 458 },
      { id: 'c4', name: 'C4', w: 229, h: 324 },
      {
        id: 'c5',
        name: 'C5',
        w: 162,
        h: 229,
      },
      {
        id: 'c6',
        name: 'C6',
        w: 114,
        h: 162,
      },
      { id: 'c7c6', name: 'C7/C6', w: 81, h: 162 },
      { id: 'c7', name: 'C7', w: 81, h: 114 },
      { id: 'c8', name: 'C8', w: 57, h: 81 },
      { id: 'c9', name: 'C9', w: 40, h: 57 },
      { id: 'c10', name: 'C10', w: 28, h: 40 },
      {
        id: 'dl',
        name: 'DL',
        w: 110,
        h: 220,
      },
    ],
  },
  {
    id: 'us',
    name: 'US Sizes',
    sizes: [
      {
        id: 'letter',
        name: 'Letter',
        w: 216,
        h: 279,
      },
      { id: 'legal', name: 'Legal', w: 216, h: 356 },
      { id: 'tabloid', name: 'Tabloid', w: 279, h: 432 },
      {
        id: 'ledger',
        name: 'Ledger',
        w: 432,
        h: 279,
      },
      {
        id: 'half-letter',
        name: 'Half Letter',
        w: 140,
        h: 216,
      },
      {
        id: 'junior-legal',
        name: 'Junior Legal',
        w: 127,
        h: 203,
      },
      { id: 'ansi-a', name: 'ANSI A', w: 216, h: 279 },
      { id: 'ansi-b', name: 'ANSI B', w: 279, h: 432 },
      { id: 'ansi-c', name: 'ANSI C', w: 432, h: 559 },
      { id: 'ansi-d', name: 'ANSI D', w: 559, h: 864 },
      { id: 'ansi-e', name: 'ANSI E', w: 864, h: 1118 },
      { id: 'arch-a', name: 'Arch A', w: 229, h: 305 },
      { id: 'arch-b', name: 'Arch B', w: 305, h: 457 },
      { id: 'arch-c', name: 'Arch C', w: 457, h: 610 },
      { id: 'arch-d', name: 'Arch D', w: 610, h: 914 },
      { id: 'arch-e', name: 'Arch E', w: 914, h: 1219 },
      { id: 'arch-e1', name: 'Arch E1', w: 762, h: 1067 },
      { id: 'arch-e2', name: 'Arch E2', w: 660, h: 965 },
      { id: 'arch-e3', name: 'Arch E3', w: 686, h: 991 },
    ],
  },
  {
    id: 'imperial',
    name: 'Imperial (UK)',
    sizes: [
      { id: 'imp-foolscap', name: 'Foolscap', w: 203, h: 330 },
      { id: 'imp-crown', name: 'Crown', w: 381, h: 508 },
      { id: 'imp-double-crown', name: 'Double Crown', w: 508, h: 762 },
      { id: 'imp-quad-crown', name: 'Quad Crown', w: 762, h: 1016 },
      { id: 'imp-demy', name: 'Demy', w: 444, h: 572 },
      { id: 'imp-double-demy', name: 'Double Demy', w: 572, h: 889 },
      { id: 'imp-quad-demy', name: 'Quad Demy', w: 889, h: 1143 },
      { id: 'imp-royal', name: 'Royal', w: 508, h: 635 },
      { id: 'imp-double-royal', name: 'Double Royal', w: 635, h: 1016 },
      { id: 'imp-imperial', name: 'Imperial', w: 559, h: 762 },
      { id: 'imp-elephant', name: 'Elephant', w: 584, h: 711 },
      { id: 'imp-atlas', name: 'Atlas', w: 660, h: 864 },
      { id: 'imp-antiquarian', name: 'Antiquarian', w: 787, h: 1346 },
    ],
  },
  {
    id: 'billboard',
    name: 'Billboard & OOH',
    sizes: [
      {
        id: 'bb-bulletin',
        name: 'Bulletin',
        w: 4267,
        h: 14630,
      },
      {
        id: 'bb-poster',
        name: '30-Sheet Poster',
        w: 3175,
        h: 6909,
      },
      {
        id: 'bb-junior',
        name: '8-Sheet Poster',
        w: 1524,
        h: 3353,
      },
      {
        id: 'bb-bus-shelter',
        name: 'Bus Shelter',
        w: 1219,
        h: 1829,
      },
      {
        id: 'bb-bus-king',
        name: 'Bus King Side',
        w: 762,
        h: 3658,
      },
      {
        id: 'bb-bus-queen',
        name: 'Bus Queen Side',
        w: 762,
        h: 2235,
      },
      {
        id: 'bb-spectacular',
        name: 'Spectacular',
        w: 6096,
        h: 18288,
      },
    ],
  },
  {
    id: 'media',
    name: 'Physical Media',
    sizes: [
      {
        id: 'media-cd-booklet',
        name: 'CD Jewel Case',
        w: 121,
        h: 120,
      },
      {
        id: 'media-cd-tray',
        name: 'CD Tray Card',
        w: 150,
        h: 118,
      },
      {
        id: 'media-dvd-wrap',
        name: 'DVD Case Wrap',
        w: 273,
        h: 184,
      },
      {
        id: 'media-bluray-wrap',
        name: 'Blu-ray Case Wrap',
        w: 171,
        h: 149,
      },
      {
        id: 'media-vinyl-12',
        name: '12" Vinyl Sleeve',
        w: 315,
        h: 315,
      },
      {
        id: 'media-vinyl-10',
        name: '10" Vinyl Sleeve',
        w: 263,
        h: 263,
      },
      {
        id: 'media-vinyl-7',
        name: '7" Vinyl Sleeve',
        w: 184,
        h: 184,
      },
      {
        id: 'media-cassette-jcard',
        name: 'Cassette J-Card',
        w: 101,
        h: 64,
      },
      {
        id: 'media-vhs-sleeve',
        name: 'VHS Sleeve',
        w: 191,
        h: 263,
      },
      {
        id: 'media-floppy-35',
        name: '3.5" Floppy Disk',
        w: 90,
        h: 94,
      },
      {
        id: 'media-gameboy-cart',
        name: 'Game Boy Cartridge',
        w: 57,
        h: 65,
      },
    ],
  },
  {
    id: 'fun',
    name: 'Fun Sizes',
    sizes: [
      {
        id: 'fun-postage-stamp',
        name: 'Postage Stamp',
        w: 25,
        h: 21,
      },
      {
        id: 'fun-credit-card',
        name: 'Credit Card',
        w: 86,
        h: 54,
      },
      {
        id: 'fun-business-card',
        name: 'Business Card',
        w: 89,
        h: 51,
      },
      {
        id: 'fun-post-it',
        name: 'Post-it Note',
        w: 76,
        h: 76,
      },
      {
        id: 'fun-playing-card',
        name: 'Playing Card',
        w: 64,
        h: 89,
      },
      {
        id: 'fun-polaroid',
        name: 'Polaroid Photo',
        w: 107,
        h: 88,
      },
      {
        id: 'fun-dollar-bill',
        name: 'US Dollar Bill',
        w: 156,
        h: 66,
      },
      {
        id: 'fun-toilet-paper',
        name: 'Toilet Paper Sheet',
        w: 114,
        h: 122,
      },
      {
        id: 'fun-comic-book',
        name: 'Comic Book Page',
        w: 171,
        h: 260,
      },
      {
        id: 'fun-newspaper',
        name: 'Broadsheet',
        w: 381,
        h: 578,
      },
      {
        id: 'fun-movie-poster',
        name: 'Movie Poster',
        w: 686,
        h: 1016,
      },
      {
        id: 'fun-pizza-box',
        name: 'Pizza Box (12")',
        w: 305,
        h: 305,
      },
    ],
  },
];
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col sm:flex-row gap-3">
      <UFormField label="Paper size" class="flex-1">
        <UInputMenu
          v-model="selectedItem"
          :items="paperSelectItems"
          :filter-fields="['label', 'series']"
          size="lg"
          class="w-full"
          variant="soft"
          placeholder="Search paper sizes…"
        />
      </UFormField>
      <UFormField label="Unit">
        <USelect
          v-model="activeUnit"
          :items="unitItems"
          size="lg"
          class="w-full sm:w-52"
          variant="soft"
        />
      </UFormField>
    </div>

    <UCard variant="subtle">
      <div class="flex items-center justify-between gap-4">
        <div>
          <p class="text-sm font-medium text-muted mb-0.5">
            {{ selectedSize.name }}
          </p>
          <p class="text-3xl font-mono font-bold text-highlighted tabular-nums">
            {{ dims(selectedSize.w, selectedSize.h, activeUnit) }}
            <span class="text-dimmed text-xl font-normal">{{
              activeUnit
            }}</span>
          </p>
        </div>
        <UButton
          :icon="
            copied === 'main'
              ? 'i-heroicons-check'
              : 'i-heroicons-clipboard-document'
          "
          :color="copied === 'main' ? 'success' : 'neutral'"
          variant="ghost"
          size="lg"
          :aria-label="`Copy ${selectedSize.name} dimensions`"
          @click="
            copy(
              'main',
              `${dims(selectedSize.w, selectedSize.h, activeUnit)} ${activeUnit}`,
            )
          "
        />
      </div>
    </UCard>
  </div>
</template>
