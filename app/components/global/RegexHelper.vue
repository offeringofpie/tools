<script lang="ts">
export const cheats = [
  {
    label: 'Character Classes',
    items: [
      { token: '\\d', short: 'Digit (0-9)', desc: 'Match a digit (0-9)' },
      { token: '\\D', short: 'Non-digit', desc: 'Match a non-digit' },
      {
        token: '\\w',
        short: 'Word char',
        desc: 'Match a word char (a-z, A-Z, 0-9, _)',
      },
      { token: '\\W', short: 'Non-word char', desc: 'Match a non-word char' },
      { token: '\\s', short: 'Whitespace', desc: 'Match a whitespace char' },
      {
        token: '\\S',
        short: 'Non-whitespace',
        desc: 'Match a non-whitespace char',
      },
      {
        token: '.',
        short: 'Any char',
        desc: 'Match any char (except newline)',
      },
    ],
  },
  {
    label: 'Anchors',
    items: [
      {
        token: '^',
        short: 'Start of string',
        desc: 'Asserts position at start of string',
      },
      {
        token: '$',
        short: 'End of string',
        desc: 'Asserts position at end of string',
      },
      { token: '\\b', short: 'Word boundary', desc: 'Word boundary' },
      { token: '\\B', short: 'Non-word boundary', desc: 'Non-word boundary' },
    ],
  },
  {
    label: 'Quantifiers',
    items: [
      { token: '*', short: '0 or more', desc: 'Match 0 or more times' },
      { token: '+', short: '1 or more', desc: 'Match 1 or more times' },
      { token: '?', short: '0 or 1', desc: 'Match 0 or 1 time' },
      {
        token: '{n,m}',
        short: 'Between n and m',
        desc: 'Between n and m times',
      },
    ],
  },
  {
    label: 'Groups & Lookarounds',
    items: [
      { token: '(', short: 'Capture group', desc: 'Capturing Group' },
      { token: '(?:', short: 'Non-capturing', desc: 'Non-capturing Group' },
      {
        token: '(?=',
        short: 'Lookahead',
        desc: 'Positive Lookahead (matches if followed by)',
      },
      {
        token: '(?!',
        short: 'Negative Lookahead',
        desc: 'Negative Lookahead (matches if NOT followed by)',
      },
      { token: ')', hidden: true, desc: 'Close Group' },
      { token: '[', short: 'Range', desc: 'Match any char in set' },
      { token: '[^', hidden: true, desc: 'Match any char NOT in set' },
      { token: '|', short: 'Alternation', desc: 'Alternation (OR)' },
    ],
  },
];

export const dict: Record<string, string> = Object.fromEntries(
  cheats.flatMap((c) => c.items).map((i) => [i.token, i.desc]),
);

export function parseRegex(pattern: string) {
  if (!pattern) return [];

  const parts = [];
  let depth = 0;
  let i = 0;

  while (i < pattern.length) {
    const char = pattern[i];
    const rest = pattern.slice(i);

    const multi = ['(?=', '(?!', '(?:'].find((t) => rest.startsWith(t));
    if (multi) {
      parts.push({ token: multi, desc: dict[multi], depth });
      depth++;
      i += 3;
      continue;
    }

    if (char === '(') {
      parts.push({ token: '(', desc: dict['('], depth });
      depth++;
      i++;
      continue;
    }
    if (char === ')') {
      depth = Math.max(0, depth - 1);
      parts.push({ token: ')', desc: dict[')'], depth });
      i++;
      continue;
    }

    const quant = rest.match(/^(\*|\+|\?|\{\d+(?:,\d*)?\})\??/);
    if (quant) {
      const q = quant[0];
      const isLazy = q.endsWith('?') && q !== '?';
      const base = isLazy ? q.slice(0, -1) : q;
      const desc =
        (base.startsWith('{')
          ? `Match ${base.replace(/[{}]/g, '')} times`
          : dict[base] || 'Quantifier') + (isLazy ? ' (lazy)' : '');
      parts.push({ token: q, desc, depth });
      i += q.length;
      continue;
    }

    if (char === '[') {
      const end = pattern.indexOf(']', i);
      if (end !== -1) {
        const token = pattern.slice(i, end + 1);
        parts.push({
          token,
          desc: dict[token.startsWith('[^') ? '[^' : '['],
          depth,
        });
        i = end + 1;
        continue;
      }
    }

    if (char === '\\' && i + 1 < pattern.length) {
      const token = char + pattern[i + 1];
      parts.push({ token, desc: dict[token] || 'Escaped character', depth });
      i += 2;
      continue;
    }

    if (['^', '$', '.', '|'].includes(char)) {
      const d = char === '|' ? Math.max(0, depth - 1) : depth;
      parts.push({ token: char, desc: dict[char], depth: d });
      i++;
      continue;
    }

    const lit = rest.match(/^[^.*+?^$()[\]{}|\\]+/);
    if (lit) {
      parts.push({ token: lit[0], desc: 'Literal match', depth });
      i += lit[0].length;
      continue;
    }

    parts.push({ token: char, desc: 'Literal char', depth });
    i++;
  }

  return parts;
}
</script>

<script setup lang="ts">
import { ref, computed } from 'vue';

const pattern = ref('');
const flags = ref('g');
const input = ref('');
const err = ref('');

const openDocs = ref(false);
const openTpl = ref(true);
const openCheat = ref(false);

const templates = [
  {
    label: 'Email',
    exp: '([a-zA-Z0-9._%-]+)@([a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})',
    flags: 'gi',
  },
  {
    label: 'URL',
    exp: '(https?:\\/\\/)?([\\da-z\\.-]+)\\.([a-z\\.]{2,6})([\\/\\w \\.-]*)*\\/?',
    flags: 'gi',
  },
  {
    label: 'UUID v4',
    exp: '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}',
    flags: 'gi',
  },
  {
    label: 'Hex Color',
    exp: '#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\\b',
    flags: 'gi',
  },
  {
    label: 'Password',
    exp: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[\\W_]).{8,}$',
    flags: 'gm',
  },
];

const docs = computed(() => parseRegex(pattern.value));

const run = computed(() => {
  const parts: { text?: string; match?: string }[] = [];
  const groups: { match: string; items: string[] }[] = [];

  if (!pattern.value || !input.value) {
    return { parts: [{ text: input.value }], groups };
  }

  try {
    err.value = '';
    const activeFlags = flags.value.includes('g')
      ? flags.value
      : flags.value + 'g';
    const re = new RegExp(pattern.value, activeFlags);

    let last = 0,
      m,
      safe = 0;

    while ((m = re.exec(input.value))) {
      if (safe++ > 9999) break;
      if (m.index === re.lastIndex) re.lastIndex++;
      if (!m[0]) continue;

      if (m.index > last)
        parts.push({ text: input.value.slice(last, m.index) });

      parts.push({ match: m[0] });
      groups.push({ match: m[0], items: m.slice(1).map((g) => g || '') });
      last = m.index + m[0].length;
    }

    if (last < input.value.length)
      parts.push({ text: input.value.slice(last) });
    return { parts, groups };
  } catch (e: any) {
    err.value = e.message;
    return { parts: [{ text: input.value }], groups: [] };
  }
});
</script>

<template>
  <div class="max-w-screen mx-auto flex flex-col lg:flex-row gap-6 items-start">
    <div class="flex-1 w-full space-y-6 min-w-0">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold text-white mb-2">
          Regex Helper
        </h1>
        <p class="text-base-400">Write, and debug regular expressions.</p>
      </div>

      <UCard class="border border-base-800 space-y-6">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-base-500 font-bold font-mono">/</span>
            <UInput
              v-model="pattern"
              size="lg"
              class="flex-1 font-mono text-lg"
              :class="{ 'ring-2 ring-error-500': err }"
              variant="subtle"
              placeholder="([a-z]+)@([a-z]+)\.([a-z]{2,})"
            >
              <span class="text-base-500 font-bold font-mono ml-2">/</span>
            </UInput>
            <UInput
              v-model="flags"
              size="lg"
              class="w-16 font-mono text-lg text-center"
              variant="subtle"
              placeholder="gmi"
              title="Flags"
            />
          </div>
          <p v-if="err" class="text-error-400 text-sm mt-2 font-mono">
            {{ err }}
          </p>
        </div>

        <div>
          <label class="block text-sm font-semibold text-white mb-2 mt-6"
            >Test String</label
          >
          <UTextarea
            v-model="input"
            :rows="4"
            size="sm"
            class="w-full font-mono"
            variant="subtle"
            placeholder="Enter text to test against..."
          />
        </div>
      </UCard>

      <UCollapsible
        v-if="docs.length"
        v-model:open="openDocs"
        class="border border-base-800 rounded-xl bg-base-900/20"
      >
        <UButton
          color="neutral"
          variant="ghost"
          block
          class="justify-between uppercase font-semibold text-sm px-4 py-3"
          :icon="
            openDocs ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          trailing
        >
          Explanation
        </UButton>
        <template #content>
          <div
            class="p-4 sm:p-6 pt-0 border-t border-base-800/50 mt-2 space-y-1.5 overflow-x-auto"
          >
            <div
              v-for="(item, i) in docs"
              :key="i"
              class="flex items-start gap-3 py-0.5"
              :style="{ paddingLeft: `${item.depth * 1.5}rem` }"
            >
              <code
                class="bg-base-950 border border-base-800 text-primary-400 px-1.5 py-0.5 rounded text-[11px] font-mono shadow-sm shrink-0 whitespace-pre"
              >
                {{ item.token }}
              </code>
              <span class="text-base-300 text-xs mt-0.5">{{ item.desc }}</span>
            </div>
          </div>
        </template>
      </UCollapsible>

      <UCard v-if="pattern && input" class="border border-base-800">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-white">Match Results</h2>
            <UBadge v-if="run.groups.length" color="primary" variant="subtle"
              >{{ run.groups.length }} match(es)</UBadge
            >
          </div>
        </template>

        <div class="space-y-4">
          <div
            class="max-h-48 overflow-y-auto custom-scrollbar rounded-lg border border-base-800 bg-base-900/70 p-4 font-mono text-sm whitespace-pre-wrap break-words"
          >
            <template v-for="(node, i) in run.parts" :key="i">
              <span v-if="node.text" class="text-base-300">{{
                node.text
              }}</span>
              <mark
                v-else
                class="bg-primary-500/30 text-primary-200 rounded px-0.5 font-semibold"
                >{{ node.match }}</mark
              >
            </template>
          </div>

          <div
            v-if="run.groups.length"
            class="max-h-64 overflow-y-auto custom-scrollbar space-y-2"
          >
            <div
              v-for="(cap, i) in run.groups"
              :key="i"
              class="bg-base-950 p-3 rounded border border-base-800 text-sm font-mono"
            >
              <div class="text-white mb-2">
                <span class="text-base-500 mr-2">Match {{ i + 1 }}</span>
                <span
                  class="bg-primary-500/20 text-primary-300 px-1.5 rounded break-all"
                  >{{ cap.match }}</span
                >
              </div>

              <div
                v-if="cap.items.length"
                class="pl-4 border-l-2 border-base-800 space-y-1"
              >
                <div
                  v-for="(g, j) in cap.items"
                  :key="j"
                  class="text-base-300 flex"
                >
                  <span class="text-secondary-500/70 mr-2 shrink-0"
                    >Group {{ j + 1 }}</span
                  >
                  <span class="break-all">{{ g }}</span>
                </div>
              </div>
              <div v-else class="pl-4 text-xs text-base-500 italic">
                No capture groups
              </div>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <div class="w-full lg:w-64 shrink-0 lg:top-0 space-y-4">
      <UCollapsible
        v-model:open="openTpl"
        class="border border-base-800 rounded-xl bg-base-900/20"
      >
        <UButton
          color="neutral"
          variant="ghost"
          block
          class="justify-between uppercase font-semibold text-sm px-4 py-3"
          :icon="
            openTpl ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          trailing
        >
          Templates
        </UButton>
        <template #content>
          <div class="p-3 pt-0 flex flex-col gap-1.5">
            <UButton
              v-for="t in templates"
              :key="t.label"
              size="xs"
              variant="soft"
              color="neutral"
              class="font-mono text-xs justify-start border border-base-800"
              @click="
                pattern = t.exp;
                flags = t.flags;
              "
            >
              {{ t.label }}
            </UButton>
          </div>
        </template>
      </UCollapsible>

      <UCollapsible
        v-model:open="openCheat"
        class="border border-base-800 rounded-xl bg-base-900/20"
      >
        <UButton
          color="neutral"
          variant="ghost"
          block
          class="justify-between uppercase font-semibold text-sm px-4 py-3"
          :icon="
            openCheat ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          trailing
        >
          Cheat Sheet
        </UButton>
        <template #content>
          <div class="p-3 pt-0 space-y-6">
            <div v-for="group in cheats" :key="group.label" class="space-y-2">
              <h3
                class="text-xs font-semibold text-base-500 uppercase tracking-wider px-1"
              >
                {{ group.label }}
              </h3>
              <div class="flex flex-col gap-1">
                <button
                  v-for="h in group.items"
                  :key="h.token"
                  v-show="!h.hidden"
                  class="flex items-center justify-between text-left hover:bg-base-800/50 p-1.5 rounded transition-colors group cursor-pointer"
                  @click="pattern += h.token"
                >
                  <code
                    class="text-primary-400 bg-base-900 border border-base-800 px-1.5 py-0.5 rounded text-[11px] font-mono group-hover:border-primary-500/30 transition-colors"
                    >{{ h.token }}</code
                  >
                  <span
                    class="text-base-400 text-xs truncate ml-2 flex-1 text-right"
                    >{{ h.short }}</span
                  >
                </button>
              </div>
            </div>
          </div>
        </template>
      </UCollapsible>
    </div>
  </div>
</template>
