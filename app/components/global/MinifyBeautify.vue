<script setup lang="ts">
import { ref } from 'vue';

const input = ref('');
const output = ref('');
const codeType = ref<CodeType>('html');
const copied = ref(false);
const busy = ref(false);

function process(action: 'minify' | 'beautify') {
  if (!input.value.trim()) {
    output.value = '';
    return;
  }

  busy.value = true;

  try {
    const type = detectCode(input.value);
    codeType.value = type;

    output.value =
      action === 'minify'
        ? minify(input.value, type)
        : beautify(input.value, type);
  } finally {
    busy.value = false;
  }
}

async function copy() {
  if (!output.value) return;

  try {
    await navigator.clipboard.writeText(output.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  } catch (err) {
    console.error(err);
  }
}
</script>

<script lang="ts">
export type CodeType = 'html' | 'css' | 'javascript' | 'svg';

export function detectCode(code: string): CodeType {
  const v = code.trim();

  if (v.startsWith('<svg') || v.includes('xmlns="http://www.w3.org/2000/svg"'))
    return 'svg';

  if (
    v.includes('<!DOCTYPE') ||
    v.includes('<html') ||
    v.includes('<div') ||
    v.includes('<p>') ||
    v.includes('</')
  )
    return 'html';

  if (
    v.includes('function') ||
    v.includes('const ') ||
    v.includes('let ') ||
    v.includes('var ') ||
    v.includes('=>')
  )
    return 'javascript';

  if (
    v.includes('{') &&
    (v.includes(':') || v.includes('px') || v.includes('color'))
  )
    return 'css';

  return 'html';
}

const SENSITIVE_TAGS = ['pre', 'code', 'textarea', 'script', 'style'];

function minifyLooseText(value: string): string {
  return value
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/>\s+</g, '><')
    .replace(/\s+/g, ' ')
    .trim();
}

export function minifyHTML(html: string): string {
  const tagRegex = new RegExp(
    `<\\s*(${SENSITIVE_TAGS.join('|')})\\b[\\s\\S]*?>[\\s\\S]*?<\\/\\s*\\1\\s*>`,
    'gi',
  );

  const parts: string[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(html))) {
    const before = html.slice(lastIndex, match.index);

    if (before.trim()) {
      parts.push(minifyLooseText(before));
    }

    parts.push(match[0]);
    lastIndex = match.index + match[0].length;
  }

  const tail = html.slice(lastIndex);
  if (tail.trim()) {
    parts.push(minifyLooseText(tail));
  }

  return parts.join('');
}

export function minifyCSS(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s*([{}:;,>+~])\s*/g, '$1')
    .replace(/;}/g, '}')
    .replace(/\s+/g, ' ')
    .trim();
}

function preserveQuotedStrings(code: string) {
  const strings: string[] = [];

  const protectedCode = code.replace(
    /(["'`])(?:\\[\s\S]|(?!\1)[^\\])*\1/g,
    (match) => {
      const token = `___STRING_${strings.length}___`;
      strings.push(match);
      return token;
    },
  );

  return {
    protectedCode,
    restore(value: string) {
      return value.replace(
        /___STRING_(\d+)___/g,
        (_, index) => strings[+index],
      );
    },
  };
}

export function minifyJavaScript(js: string): string {
  const { protectedCode, restore } = preserveQuotedStrings(js);

  let result = protectedCode;

  result = result.replace(/\/\*[\s\S]*?\*\//g, '');
  result = result.replace(/(^|[^\w/:])\/\/[^\n\r]*/gm, '$1');

  result = result
    .replace(/\s+/g, ' ')
    .replace(/\s*([=+\-*/%<>!&|^~?:,;(){}[\]])\s*/g, '$1')
    .replace(/\s*\.\s*/g, '.')
    .trim();

  return restore(result);
}

export function minifySVG(svg: string): string {
  return svg
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\?xml[\s\S]*?\?>/g, '')
    .replace(/>\s+</g, '><')
    .replace(/\s+/g, ' ')
    .replace(/\s*=\s*/g, '=')
    .trim();
}

function indented(line: string, depth: number) {
  return '  '.repeat(depth) + line;
}

export function beautifyHTML(code: string): string {
  const lines = code
    .replace(/>\s*</g, '>\n<')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const selfClosing =
    /^<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)(\s|>)/i;
  let depth = 0;
  const out: string[] = [];

  for (const line of lines) {
    if (/^<\/.+>/.test(line)) depth = Math.max(depth - 1, 0);
    out.push(indented(line, depth));
    if (/^<[^/!][^>]*[^/]>$/.test(line) && !selfClosing.test(line)) depth++;
  }

  return out.join('\n');
}

export function beautifyCSS(css: string): string {
  const lines = css
    .replace(/\{/g, ' {\n')
    .replace(/;/g, ';\n')
    .replace(/\}/g, '\n}\n')
    .replace(/,\s*/g, ', ')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  let depth = 0;
  const out: string[] = [];

  for (const line of lines) {
    if (line === '}') depth = Math.max(depth - 1, 0);
    out.push(indented(line, depth));
    if (line.endsWith('{')) depth++;
  }

  return out.join('\n');
}

export function beautifyJavaScript(js: string): string {
  const lines = js
    .replace(/\{/g, ' {\n')
    .replace(/\}/g, '\n}\n')
    .replace(/;/g, ';\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  let depth = 0;
  const out: string[] = [];

  for (const line of lines) {
    if (line === '}') depth = Math.max(depth - 1, 0);
    out.push(indented(line, depth));
    if (line.endsWith('{')) depth++;
  }

  return out.join('\n');
}

export function minify(code: string, type: CodeType): string {
  switch (type) {
    case 'html':
      return minifyHTML(code);
    case 'css':
      return minifyCSS(code);
    case 'javascript':
      return minifyJavaScript(code);
    case 'svg':
      return minifySVG(code);
    default:
      return code;
  }
}

export function beautify(code: string, type: CodeType): string {
  switch (type) {
    case 'html':
    case 'svg':
      return beautifyHTML(code);
    case 'css':
      return beautifyCSS(code);
    case 'javascript':
      return beautifyJavaScript(code);
    default:
      return code;
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-2">
      <h1 class="text-2xl md:text-3xl font-bold text-white">
        Code Minifier / Beautifier
      </h1>
      <p class="text-base-400 max-w-2xl">
        Quick & dirty HTML, CSS, JavaScript code minifier or beautifier.
      </p>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <UCard class="h-full">
        <template #header>
          <div
            class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <h2 class="text-lg font-semibold text-white">Input</h2>
              <p class="text-sm text-base-400">Paste code here.</p>
            </div>
            <UFieldGroup class="flex-wrap">
              <UButton
                color="primary"
                variant="outline"
                icon="i-heroicons-arrow-left-end-on-rectangle"
                :loading="busy"
                :ui="{
                  base: 'hover:bg-primary-100/20 hover:text-primary-200 cursor-pointer',
                }"
                @click="process('minify')"
              >
                Minify
              </UButton>
              <UButton
                color="primary"
                variant="outline"
                icon="i-heroicons-sparkles"
                :loading="busy"
                :ui="{
                  base: 'hover:bg-primary-100/20 hover:text-primary-200 cursor-pointer',
                }"
                @click="process('beautify')"
              >
                Beautify
              </UButton>
            </UFieldGroup>
          </div>
        </template>

        <UTextarea
          v-model="input"
          :rows="18"
          :maxrows="18"
          size="xl"
          variant="subtle"
          placeholder="Paste your code here..."
          :ui="{ root: 'w-full', base: 'w-full font-mono text-sm' }"
        />
      </UCard>

      <UCard class="h-full">
        <template #header>
          <div
            class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <h2 class="text-lg font-semibold text-white">Output</h2>
              <p class="text-sm text-base-400">
                Your processed code appears here.
              </p>
            </div>
            <UButton
              color="secondary"
              variant="soft"
              icon="i-heroicons-document-duplicate"
              class="cursor-pointer"
              :disabled="!output"
              @click="copy"
            >
              {{ copied ? 'Copied' : 'Copy' }}
            </UButton>
          </div>
        </template>

        <div
          class="min-h-96 rounded-lg border border-base-800 bg-base-900/70 p-4 overflow-auto"
        >
          <pre
            class="text-sm text-base-100 whitespace-pre-wrap wrap-break-word font-mono"
            >{{ output }}</pre
          >
        </div>
      </UCard>
    </div>
  </div>
</template>
