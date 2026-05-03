<script lang="ts">
export interface NthClass {
  selector: string;
  step: number;
  offset: number;
  members: number[];
}

export interface PatternResult {
  classes: NthClass[];
  predicted: Set<number>;
  isFullyCovered: boolean;
  uncovered: number[];
}

/**
 * Calculates the Greatest Common Divisor of two numbers using the Euclidean
 * algorithm: repeatedly replacing the larger number with the remainder of
 * dividing the two, until the remainder is zero.
 * https://en.wikipedia.org/wiki/Euclidean_algorithm
 */
export const gcd = (a: number, b: number): number => {
  return b === 0 ? a : gcd(b, a % b);
};

/**
 * Reduces a list of numbers to their single shared GCD
 */
export const gcdShared = (nums: number[]): number => {
  return nums.reduce((acc, n) => gcd(acc, n));
};

/**
 * Simplified Sieve of Eratosthenes style :not() list for primes up to 120
 * https://en.wikipedia.org/wiki/Sieve_of_Eratosthenes
 */
export const usePrime = (): string[] => {
  return [2, 3, 5, 7].map((p) => `${p}n+${2 * p}`);
};

const getDivisors = (n: number): number[] => {
  const result: number[] = [];
  for (let i = 1; i * i <= n; i++) {
    if (n % i === 0) {
      result.push(i);
      if (i !== n / i) result.push(n / i);
    }
  }
  return result.sort((a, b) => b - a);
};

const build = (step: number, offset: number): string => {
  if (step === 1 && offset === 1) return 'n';
  if (step === 1) return `n+${offset}`;
  if (offset === step) return `${step}n`;
  return `${step}n+${offset}`;
};

const getMembers = (step: number, offset: number, total: number): number[] => {
  const out: number[] = [];
  for (let n = 0; ; n++) {
    const v = step * n + offset;
    if (v > total) break;
    if (v >= 1) out.push(v);
  }
  return out;
};

const addClass = (
  group: number[],
  selectedSet: Set<number>,
  total: number,
): NthClass | null => {
  if (group.length === 0) return null;

  if (group.length === 1) {
    const v = group[0]!;
    return { selector: String(v), step: 0, offset: v, members: [v] };
  }

  const diffs = group.slice(1).map((v, i) => v - group[i]!);
  const stride = gcdShared(diffs);

  for (const step of getDivisors(stride)) {
    const first = group[0]!;
    const offset = first % step || step;

    if (!group.every((v) => (v - offset) % step === 0)) continue;

    const last = group[group.length - 1]!;
    const hasGap = Array.from(
      { length: Math.floor((last - first) / step) + 1 },
      (_, i) => first + i * step,
    ).some((v) => !selectedSet.has(v));

    if (!hasGap) {
      return {
        selector: build(step, first),
        step,
        offset: first,
        members: getMembers(step, first, total),
      };
    }
  }

  const v = group[0]!;
  return { selector: String(v), step: 0, offset: v, members: [v] };
};

const split = (sorted: number[]): number[][] => {
  if (sorted.length === 0) return [];
  if (sorted.length === 1) return [[sorted[0]!]];

  const diffs = sorted.slice(1).map((v, i) => v - sorted[i]!);
  const baseStep = gcdShared(diffs);
  const searchLimit = Math.max(...diffs) * sorted.length;

  for (let period = baseStep; period <= searchLimit; period += baseStep) {
    const groups = new Map<number, number[]>();
    for (const v of sorted) {
      const key = v % period || period;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(v);
    }

    const allEvenlySpaced = [...groups.values()].every((members) =>
      members.every((v, i) => i === 0 || v - members[i - 1]! === period),
    );

    if (allEvenlySpaced)
      return [...groups.values()].sort((a, b) => a[0]! - b[0]!);
  }

  return sorted.map((v) => [v]);
};

export const getPattern = (
  selected: number[],
  total: number,
): PatternResult => {
  const empty: PatternResult = {
    classes: [],
    predicted: new Set(),
    isFullyCovered: true,
    uncovered: [],
  };
  if (selected.length === 0) return empty;

  const sorted = [...selected].sort((a, b) => a - b);
  const selectedSet = new Set(selected);

  if (sorted.length === 1) {
    const v = sorted[0]!;
    return {
      classes: [{ selector: String(v), step: 0, offset: v, members: [v] }],
      predicted: new Set(),
      isFullyCovered: true,
      uncovered: [],
    };
  }

  if (sorted.length === total) {
    return {
      classes: [
        {
          selector: 'n',
          step: 1,
          offset: 1,
          members: Array.from({ length: total }, (_, i) => i + 1),
        },
      ],
      predicted: new Set(),
      isFullyCovered: true,
      uncovered: [],
    };
  }

  const groups = split(sorted);
  const classes = groups
    .map((g) => addClass(g, selectedSet, total))
    .filter((c): c is NthClass => c !== null);

  const predicted = new Set<number>();
  for (const cls of classes) {
    if (cls.step > 0) {
      for (const m of cls.members) {
        if (!selectedSet.has(m)) predicted.add(m);
      }
    }
  }

  const uncovered = sorted.filter(
    (v) => !classes.some((c) => c.offset === v || c.members.includes(v)),
  );

  return {
    classes,
    predicted,
    isFullyCovered: uncovered.length === 0,
    uncovered,
  };
};

export const getNegativePattern = (
  selected: number[],
  total: number,
): NthClass[] => {
  const selectedSet = new Set(selected);
  const excluded = Array.from({ length: total }, (_, i) => i + 1).filter(
    (i) => !selectedSet.has(i),
  );
  return getPattern(excluded, total).classes;
};
</script>

<script setup lang="ts">
const MIN = 20;
const MAX = 100;
const STEP = 10;

const total = ref<number>(20);
const selected = ref<Set<number>>(new Set());
const copied = ref(false);
const minItems = ref<number>(4);
const openSection = ref<string | null>('info');
const useNegative = ref(false);
const usePrimes = ref(false);

const sortedSelected = computed(() =>
  [...selected.value].sort((a, b) => a - b),
);

const pattern = computed(() => getPattern(sortedSelected.value, total.value));

const showPredictions = computed(
  () =>
    sortedSelected.value.length >= minItems.value &&
    pattern.value.classes.length > 0,
);

const predicted = computed(
  (): Set<number> =>
    showPredictions.value ? pattern.value.predicted : new Set(),
);

const negationClasses = computed(() =>
  useNegative.value && !usePrimes.value
    ? getNegativePattern(sortedSelected.value, total.value)
    : [],
);

const sieveNots = computed(() => (usePrimes.value ? usePrime() : []));

const cssOutput = computed(() => {
  if (usePrimes.value) {
    const nots = sieveNots.value;
    if (nots.length === 0) return ':nth-child(n) {\n  \n}';
    const notParts = nots.map((s) => `\n:not(:nth-child(${s}))`).join('');
    return `:nth-child(n)${notParts} {\n  \n}`;
  }

  const r = pattern.value;

  if (useNegative.value && negationClasses.value.length > 0) {
    const selectors = negationClasses.value
      .map((c) => `:not(:nth-child(${c.selector}))`)
      .join(',\n');
    return `:nth-child(n),\n${selectors} {\n  \n}`;
  }

  if (r.classes.length === 0) return '';

  const selectors = r.classes.map((cls) => `:nth-child(${cls.selector})`);

  if (r.uncovered.length > 0) {
    selectors.push(...r.uncovered.map((n) => `:nth-child(${n})`));
  }

  return `${selectors.join(',\n')} {\n  \n}`;
});

type ItemState = 'selected' | 'predicted' | 'idle';
const getItemState = (i: number): ItemState => {
  if (selected.value.has(i)) return 'selected';
  if (predicted.value.has(i)) return 'predicted';
  return 'idle';
};

const toggle = (i: number) => {
  const next = new Set(selected.value);
  useNegative.value = false;
  usePrimes.value = false;

  if (next.has(i)) {
    next.delete(i);
  } else {
    next.add(i);
  }

  selected.value = next;
};

const clearAll = () => {
  selected.value = new Set();
  usePrimes.value = false;
  useNegative.value = false;
};

const applyPreset = (
  steps: { step: number; b: number }[],
  fn?: (n: number) => boolean,
  negation = false,
  sievePrimes = false,
) => {
  const range = Array.from({ length: total.value }, (_, i) => i + 1);
  useNegative.value = negation;
  usePrimes.value = sievePrimes;

  const matches = fn
    ? range.filter(fn)
    : range.filter((i) =>
        steps.some(({ step, b }) => i >= b && (i - b) % step === 0),
      );

  selected.value = new Set(matches);
};

const increaseTotal = () => {
  if (total.value < MAX) total.value = Math.min(total.value + STEP, MAX);
};

const decreaseTotal = () => {
  if (total.value > MIN) {
    total.value = Math.max(total.value - STEP, MIN);
    selected.value = new Set(
      [...selected.value].filter((i) => i <= total.value),
    );
  }
};

const copy = async () => {
  try {
    await navigator.clipboard.writeText(cssOutput.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  } catch {
    // noop
  }
};

const isPrime = (n: number) => {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
};

const getFibs = (max: number) => {
  const set = new Set<number>();
  let a = 1,
    b = 1;
  while (a <= max) {
    set.add(a);
    [a, b] = [b, a + b];
  }
  return set;
};

const isPow2 = (n: number) => (n & (n - 1)) === 0;

const Sections = [{ key: 'presets' as const, label: 'Presets' }];
</script>

<template>
  <div class="space-y-6 max-w-6xl mx-auto">
    <div class="space-y-2">
      <h1 class="text-2xl md:text-3xl font-bold text-white">
        :nth-child Helper
      </h1>
      <p class="text-base-400">Helping make :nth-child() rules since 2026.</p>
    </div>

    <div class="flex flex-col-reverse md:flex-row items-start gap-4">
      <main class="flex-1 flex flex-col min-w-0 items-end-safe gap-5">
        <div class="flex gap-2 w-fit items-end">
          <UFormField>
            <div class="flex items-center gap-2">
              <UButton
                :disabled="total <= MIN"
                color="neutral"
                variant="outline"
                size="sm"
                icon="i-heroicons-minus"
                @click="decreaseTotal"
              />
              {{ total }}
              <UButton
                :disabled="total >= MAX"
                color="neutral"
                variant="outline"
                size="sm"
                icon="i-heroicons-plus"
                @click="increaseTotal"
              />
            </div>
          </UFormField>
          <UButton
            variant="ghost"
            color="error"
            icon="i-heroicons-trash"
            class="self-end"
            @click="clearAll"
          >
            Clear
          </UButton>
        </div>

        <div
          class="flex-1 rounded-xl border border-dashed border-default bg-elevated overflow-auto p-4 space-y-3 w-full"
        >
          <div class="flex flex-col gap-3">
            <div class="grid gap-2 grid-cols-13">
              <UButton
                v-for="i in total"
                :key="i"
                :color="getItemState(i) === 'selected' ? 'primary' : 'neutral'"
                variant="soft"
                class="aspect-square rounded font-bold font-mono transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary flex items-center justify-center leading-none"
                :class="[
                  getItemState(i) === 'selected'
                    ? 'text-primary'
                    : getItemState(i) === 'predicted'
                      ? 'border-2 border-dashed opacity-50 text-primary'
                      : 'text-base-400',
                ]"
                :title="`Child #${i}${predicted.has(i) ? ' — predicted' : ''}`"
                @click="toggle(i)"
              >
                {{ i }}
              </UButton>
            </div>
          </div>
        </div>
      </main>

      <aside class="w-full lg:w-120 shrink-0">
        <div class="lg:overflow-y-auto space-y-1">
          <UCollapsible
            v-for="section in Sections"
            :key="section.key"
            :open="openSection === section.key"
            @update:open="
              openSection = openSection === section.key ? null : section.key
            "
          >
            <UButton
              variant="soft"
              color="neutral"
              class="flex items-center justify-between w-full uppercase tracking-wide"
            >
              {{ section.label }}
              <UIcon
                :name="
                  openSection === section.key
                    ? 'i-heroicons-chevron-up'
                    : 'i-heroicons-chevron-down'
                "
                class="size-3.5"
              />
            </UButton>

            <template #content>
              <div
                v-if="section.key === 'presets'"
                class="p-3 flex flex-wrap gap-1.5"
              >
                <UButton
                  v-for="cfg in [
                    { label: 'Odd (2n+1)', steps: [{ step: 2, b: 1 }] },
                    { label: 'Even (2n)', steps: [{ step: 2, b: 2 }] },
                    { label: 'Every 3rd', steps: [{ step: 3, b: 3 }] },
                    { label: 'Every 5th', steps: [{ step: 5, b: 5 }] },
                    {
                      label: 'Every pair',
                      steps: [
                        { step: 3, b: 1 },
                        { step: 3, b: 2 },
                      ],
                    },
                    {
                      label: 'Prime numbers',
                      steps: [],
                      fn: (n: number) => isPrime(n),
                      negation: false,
                      sievePrimes: true,
                    },
                    {
                      label: 'Fibonacci',
                      steps: [],
                      fn: (n: number) => getFibs(total).has(n),
                    },
                    {
                      label: 'Power of 2',
                      steps: [],
                      fn: (n: number) => isPow2(n),
                    },
                  ]"
                  :key="cfg.label"
                  color="neutral"
                  variant="outline"
                  size="sm"
                  class="w-[calc(50%-0.1875rem)] justify-start"
                  @click="
                    applyPreset(
                      cfg.steps,
                      cfg.fn,
                      cfg.negation,
                      cfg.sievePrimes,
                    )
                  "
                >
                  {{ cfg.label }}
                </UButton>
              </div>
            </template>
          </UCollapsible>

          <div class="flex flex-col gap-2">
            <pre
              class="rounded-lg border border-default bg-elevated px-4 py-3 text-xs font-mono text-highlighted overflow-x-auto leading-relaxed min-h-80 max-h-120 relative">{{ cssOutput }}
              <UButton
                block
                class="absolute top-2 right-2 w-fit p-2"
                :color="copied ? 'primary' : 'neutral'"
                size="sm"
                variant="subtle"
                :icon="copied ? 'i-heroicons-check' : 'i-heroicons-document-duplicate'"
                @click="copy"
              /></pre>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>
