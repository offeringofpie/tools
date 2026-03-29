<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useBreakpoints, breakpointsTailwind } from '@vueuse/core';

interface Unit {
  id: string;
  name: string;
  ratio?: number;
  toBase?: (v: number | string) => number;
  fromBase?: (v: number) => number | string;
}

interface Category {
  id: string;
  name: string;
  units: Unit[];
}

const categories: Category[] = [
  {
    id: 'length',
    name: 'Length',
    units: [
      { id: 'm', name: 'Meters', ratio: 1 },
      { id: 'cm', name: 'Centimeters', ratio: 0.01 },
      { id: 'mm', name: 'Millimeters', ratio: 0.001 },
      { id: 'km', name: 'Kilometers', ratio: 1000 },
      { id: 'mi', name: 'Miles', ratio: 1609.344 },
      { id: 'lea', name: 'Leagues', ratio: 6172.84 },
      { id: 'yd', name: 'Yards', ratio: 0.9144 },
      { id: 'ft', name: 'Feet', ratio: 0.3048 },
      { id: 'in', name: 'Inches', ratio: 0.0254 },
      { id: 'fu', name: 'Furlongs', ratio: 201.168 },
      { id: 'fa', name: 'Fathoms', ratio: 1.8288 },
      { id: 'cu', name: 'Royal Cubits', ratio: 0.5292 },
      { id: 'au', name: 'Astronomical units', ratio: 149597870700 },
      { id: 'ly', name: 'Lightyears', ratio: 9460730472580800 },
      { id: 'par', name: 'Parsecs', ratio: 30856775814671900 },
      { id: 'semi', name: 'Semi-Marathons', ratio: 21097.5 },
      { id: 'marathon', name: 'Marathons', ratio: 42195 },
    ],
  },
  {
    id: 'weight',
    name: 'Weight / Mass',
    units: [
      { id: 'kg', name: 'Kilograms', ratio: 1 },
      { id: 'g', name: 'Grams', ratio: 0.001 },
      { id: 'mg', name: 'Milligrams', ratio: 0.000001 },
      { id: 'lb', name: 'Pounds', ratio: 0.453592 },
      { id: 'st', name: 'Stone', ratio: 6.35 },
      { id: 'oz', name: 'Ounces', ratio: 0.0283495 },
      { id: 'sh', name: 'Shekels', ratio: 87.719298246 },
      { id: 'cwt', name: 'Quintals', ratio: 0.01 },
      { id: 'ton', name: 'Tons', ratio: 1016 },
    ],
  },
  {
    id: 'temperature',
    name: 'Temperature',
    units: [
      {
        id: 'c',
        name: 'Celsius',
        toBase: (v) => Number(v),
        fromBase: (v) => v,
      },
      {
        id: 'f',
        name: 'Fahrenheit',
        toBase: (v) => ((Number(v) - 32) * 5) / 9,
        fromBase: (v) => (v * 9) / 5 + 32,
      },
      {
        id: 'k',
        name: 'Kelvin',
        toBase: (v) => Number(v) - 273.15,
        fromBase: (v) => v + 273.15,
      },
    ],
  },
  {
    id: 'speed',
    name: 'Speed',
    units: [
      { id: 'ms', name: 'Meters per second', ratio: 1 },
      { id: 'kmh', name: 'Kilometers per hour', ratio: 0.277778 },
      { id: 'mph', name: 'Miles per hour', ratio: 0.44704 },
      { id: 'fps', name: 'Feet per second', ratio: 0.3048 },
      { id: 'fph', name: 'Feet per hour', ratio: 0.00008467 },
      { id: 'knot', name: 'Knots', ratio: 0.514444 },
      { id: 'mach', name: 'Mach', ratio: 295.04640106 },
      { id: 'ov', name: 'Earth speed', ratio: 29765 },
      { id: 'warp1', name: 'Speed of Light (c)', ratio: 299792458 },
    ],
  },
  {
    id: 'area',
    name: 'Area',
    units: [
      { id: 'm2', name: 'Square Meters', ratio: 1 },
      { id: 'in2', name: 'Square Inches', ratio: 0.00064516 },
      { id: 'ft2', name: 'Square Feet', ratio: 0.092903 },
      { id: 'km2', name: 'Square Kilometers', ratio: 1000000 },
      { id: 'mi2', name: 'Square Miles', ratio: 2589988.11 },
      { id: 'ha', name: 'Hectares', ratio: 10000 },
      { id: 'ac', name: 'Acres', ratio: 4046.86 },
      { id: 'ff', name: 'American Football Fields', ratio: 5351.21 },
    ],
  },
  {
    id: 'volume',
    name: 'Volume',
    units: [
      { id: 'l', name: 'Liters', ratio: 1 },
      { id: 'ml', name: 'Milliliters', ratio: 0.001 },
      { id: 'm3', name: 'Cubic Meters', ratio: 1000 },
      { id: 'gal', name: 'US Gallons', ratio: 3.78541 },
      { id: 'qt', name: 'US Quarts', ratio: 0.946353 },
      { id: 'pt', name: 'US Pints', ratio: 0.473176 },
      { id: 'cup', name: 'US Cups', ratio: 0.236588 },
      { id: 'floz', name: 'US Fluid Ounces', ratio: 0.0295735 },
      { id: 'mcb', name: 'Minecraft Blocks', ratio: 1000 },
      { id: 'tbsp', name: 'Tablespoons', ratio: 0.0147868 },
      { id: 'tsp', name: 'Teaspoons', ratio: 0.00492892 },
      { id: 'pinch', name: 'Pinches', ratio: 0.000308057 },
    ],
  },
  {
    id: 'amount',
    name: 'Amount',
    units: [
      { id: 'item', name: 'Single Items', ratio: 1 },
      { id: 'pair', name: 'Pairs', ratio: 2 },
      { id: 'dozen', name: 'Dozens', ratio: 12 },
      { id: 'baker', name: "Baker's Dozens", ratio: 13 },
      { id: 'score', name: 'Scores', ratio: 20 },
      { id: 'gross', name: 'Gross (144)', ratio: 144 },
      { id: 'ream', name: 'Reams of Paper', ratio: 500 },
      { id: 'mole', name: 'Moles (Chemistry)', ratio: 6.02214076e23 },
    ],
  },
  {
    id: 'angles',
    name: 'Angles',
    units: [
      { id: 'deg', name: 'Degrees', ratio: 1 },
      { id: 'rad', name: 'Radians', ratio: 180 / Math.PI },
      { id: 'grad', name: 'Gradians', ratio: 0.9 },
    ],
  },
  {
    id: 'energy',
    name: 'Power',
    units: [
      { id: 'j', name: 'Joules', ratio: 1 },
      { id: 'kj', name: 'Kilojoules', ratio: 1000 },
      { id: 'cal', name: 'Calories (gram)', ratio: 4.184 },
      { id: 'kcal', name: 'Kilocalories (Food)', ratio: 4184 },
      { id: 'wh', name: 'Watt-hours', ratio: 3600 },
      { id: 'kwh', name: 'Kilowatt-hours', ratio: 3600000 },
      { id: 'ev', name: 'Electronvolts', ratio: 1.602176634e-19 },
    ],
  },
  {
    id: 'pressure',
    name: 'Pressure',
    units: [
      { id: 'pa', name: 'Pascals', ratio: 1 },
      { id: 'kpa', name: 'Kilopascals', ratio: 1000 },
      { id: 'bar', name: 'Bar', ratio: 100000 },
      { id: 'psi', name: 'Pound-force per sq in', ratio: 6894.757 },
      { id: 'atm', name: 'Standard Atmospheres', ratio: 101325 },
      { id: 'torr', name: 'Torr (mmHg)', ratio: 133.322 },
    ],
  },
  {
    id: 'numbers',
    name: 'Number Bases',
    units: [
      {
        id: 'dec',
        name: 'Decimal (Base 10)',
        toBase: (v) => parseInt(v.toString(), 10),
        fromBase: (v) => v.toString(10),
      },
      {
        id: 'bin',
        name: 'Binary (Base 2)',
        toBase: (v) => parseInt(v.toString(), 2),
        fromBase: (v) => Math.floor(v).toString(2),
      },
      {
        id: 'hex',
        name: 'Hexadecimal (Base 16)',
        toBase: (v) => parseInt(v.toString(), 16),
        fromBase: (v) => Math.floor(v).toString(16).toUpperCase(),
      },
      {
        id: 'oct',
        name: 'Octal (Base 8)',
        toBase: (v) => parseInt(v.toString(), 8),
        fromBase: (v) => Math.floor(v).toString(8),
      },
      {
        id: 'b36',
        name: 'Base 36 (Alphanumeric)',
        toBase: (v) => parseInt(v.toString(), 36),
        fromBase: (v) => Math.floor(v).toString(36).toUpperCase(),
      },
      {
        id: 'b32',
        name: 'Base 32',
        toBase: (v) => parseInt(v.toString(), 32),
        fromBase: (v) => Math.floor(v).toString(32).toUpperCase(),
      },
      {
        id: 'tri',
        name: 'Ternary (Base 3)',
        toBase: (v) => parseInt(v.toString(), 3),
        fromBase: (v) => Math.floor(v).toString(3),
      },
      {
        id: 'qua',
        name: 'Quaternary (Base 4)',
        toBase: (v) => parseInt(v.toString(), 4),
        fromBase: (v) => Math.floor(v).toString(4),
      },
      {
        id: 'qui',
        name: 'Quinary (Base 5)',
        toBase: (v) => parseInt(v.toString(), 5),
        fromBase: (v) => Math.floor(v).toString(5),
      },
      {
        id: 'sex',
        name: 'Senary (Base 6)',
        toBase: (v) => parseInt(v.toString(), 6),
        fromBase: (v) => Math.floor(v).toString(6),
      },
      {
        id: 'sep',
        name: 'Septenary (Base 7)',
        toBase: (v) => parseInt(v.toString(), 7),
        fromBase: (v) => Math.floor(v).toString(7),
      },
      {
        id: 'non',
        name: 'Nonary (Base 9)',
        toBase: (v) => parseInt(v.toString(), 9),
        fromBase: (v) => Math.floor(v).toString(9),
      },
      {
        id: 'duo',
        name: 'Duodecimal (Base 12)',
        toBase: (v) => parseInt(v.toString(), 12),
        fromBase: (v) => Math.floor(v).toString(12).toUpperCase(),
      },
      {
        id: 'vig',
        name: 'Mayan (Base 20)',
        toBase: (v) => parseInt(v.toString(), 20),
        fromBase: (v) => Math.floor(v).toString(20).toUpperCase(),
      },
    ],
  },
  {
    id: 'storage',
    name: 'Digital Storage',
    units: [
      { id: 'b', name: 'Bits', ratio: 0.125 },
      { id: 'B', name: 'Bytes', ratio: 1 },
      { id: 'KB', name: 'Kilobytes (KB)', ratio: 1024 },
      { id: 'MB', name: 'Megabytes (MB)', ratio: 1048576 },
      { id: 'GB', name: 'Gigabytes (GB)', ratio: 1073741824 },
      { id: 'TB', name: 'Terabytes (TB)', ratio: 1099511627776 },
      { id: 'PB', name: 'Petabytes (PB)', ratio: 1125899906842624 },
      { id: 'floppy', name: 'Floppy Disks (3.5")', ratio: 1474560 },
      { id: 'nib', name: 'Nibbles', ratio: 0.5 },
      { id: 'ch', name: 'Characters', ratio: 1 },
      { id: 'w', name: 'Words', ratio: 2 },
    ],
  },
];

function convert(val: number, from: string, to: string, cat: string) {
  if (!val && val !== 0) return '';

  const categoryUnits = categories.find((c) => c.id === cat)?.units;
  const a = categoryUnits?.find((u) => u.id === from);
  const b = categoryUnits?.find((u) => u.id === to);
  if (!a || !b) return 0;

  const base = a.toBase ? a.toBase(val) : Number(val) * (a.ratio || 1);
  if (isNaN(base)) return '';

  const res = b.fromBase ? b.fromBase(base) : base / (b.ratio || 1);

  return typeof res === 'number' ? parseFloat(res.toPrecision(12)) : res;
}

function format(val: number | string): string {
  if (typeof val === 'string') return val;
  if (val === 0) return '0';

  const absVal = Math.abs(val);

  if (absVal >= 1e12 || (absVal < 1e-6 && absVal > 0)) {
    return val.toExponential(4);
  }

  return val.toString();
}

const tabs = computed(() =>
  categories.map((c) => ({
    label: c.name,
    value: c.id,
  })),
);

const active = ref(tabs.value[0]?.value ?? '');

const focused = ref<string | null>(null);

const units = computed(() => {
  const cat = categories.find((c) => c.id === active.value);
  return cat ? cat.units.map((u) => ({ id: u.id, label: u.name })) : [];
});

const source = ref(units.value[0]?.id ?? '');
const input = ref<number | string>(1);
const breakpoints = useBreakpoints(breakpointsTailwind);

const orientation = computed(() =>
  breakpoints.smaller('md').value ? 'horizontal' : 'vertical',
);

watch(active, () => {
  source.value = units.value[0]?.id ?? '';
  input.value = 1;
});

const cards = computed(() => {
  if (!source.value) return [];

  return units.value.map((u) => {
    const isSource = u.id === source.value;
    const raw = isSource
      ? input.value
      : convert(Number(input.value), source.value, u.id, active.value);

    return {
      id: u.id,
      label: u.label,
      value: raw === '' ? '' : isSource ? raw : format(raw),
    };
  });
});

const copied = ref<string | null>(null);

function update(id: string, val: string | number) {
  source.value = id;
  input.value = val;
}

function copy(id: string, val: number | string) {
  navigator.clipboard.writeText(`${val}`);
  copied.value = id;
  setTimeout(() => {
    if (copied.value === id) copied.value = null;
  }, 1000);
}

function blur(e: FocusEvent) {
  const target = e?.relatedTarget as HTMLElement | null;
  if (!target?.closest('button')) {
    focused.value = null;
  }
}
</script>

<template>
  <div class="max-w-screen mx-auto flex flex-col md:flex-row gap-4 items-start">
    <UCard class="flex-1 w-full order-2 md:order-1 min-w-0">
      <UPageGrid>
        <UFormField v-for="card in cards" :key="card.id" :label="card.label">
          <UInput
            :model-value="String(card.value)"
            :name="card.id"
            :inputmode="active === 'numbers' ? 'text' : 'decimal'"
            type="text"
            size="xl"
            class="w-full font-mono text-lg font-medium transition-all duration-300 focus:ring-2 focus:ring-secondary-500"
            variant="subtle"
            @update:model-value="update(card.id, $event)"
            @focus="focused = card.id"
            @blur="blur($event)"
          >
            <template #trailing>
              <div v-show="focused === card.id || copied === card.id">
                <UButton
                  v-if="copied !== card.id"
                  variant="ghost"
                  color="neutral"
                  class="focus:text-primary hover:text-primary"
                  icon="i-heroicons-clipboard-document"
                  aria-label="Copy to clipboard"
                  @click="copy(card.id, card.value)"
                  @blur="focused = null"
                />
                <UButton
                  v-else
                  variant="ghost"
                  color="primary"
                  icon="i-heroicons-check"
                  class="pointer-events-none"
                  aria-label="Copied!"
                />
              </div>
            </template>
          </UInput>
        </UFormField>
      </UPageGrid>
    </UCard>

    <div class="w-full md:w-48 lg:w-56 shrink-0 order-1 md:order-2 md:sticky">
      <UTabs
        v-model="active"
        :items="tabs"
        aria-label="Select category"
        color="primary"
        variant="link"
        :orientation="orientation"
        :content="false"
        class="hidden md:block w-full"
      />
    </div>
  </div>
</template>
