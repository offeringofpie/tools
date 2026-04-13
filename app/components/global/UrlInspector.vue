<script setup lang="ts">
import { ref, computed } from 'vue';

type Meta = string | string[];
type Link = {
  href: string;
  hreflang?: string;
  title?: string;
  media?: string;
  type?: string;
};
type Feed = { href: string; title?: string; type?: string };
type Icon = { href: string; rel?: string; sizes?: string; type?: string };

interface InspectResult {
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
  url?: string;
  screenshot?: string;
  openGraph?: Record<string, Meta>;
  twitter?: Record<string, Meta>;
  meta?: Record<string, Meta>;
  jsonLd?: any[];
  html?: { lang?: string; titleTag?: string };
  links?: {
    canonical?: string;
    manifest?: string;
    icons?: Icon[];
    alternates?: Link[];
    feeds?: Feed[];
  };
  derived?: {
    siteName?: string;
    type?: string;
    locale?: string;
    robots?: string;
    themeColor?: string;
    author?: string;
    generator?: string;
  };
}

const url = ref('');
const result = ref<InspectResult | null>(null);
const loading = ref(false);
const loadingShot = ref(false);
const copied = ref<string | null>(null);
const error = ref('');
const screenshotError = ref('');
const activeTab = ref('preview');
const headers = { 'x-og-client': 'jl-tools-fetch-proxy' };

const sr = computed(() => result.value ?? ({} as InspectResult));
const hasResult = computed(() => !!result.value);

const cleanHost = computed(() => {
  try {
    return new URL(sr.value.url!).hostname.replace('www.', '');
  } catch {
    return sr.value.url ?? '';
  }
});

const sortedEntries = (obj?: Record<string, Meta>) =>
  Object.entries(obj ?? {}).sort(([a], [b]) => a.localeCompare(b));

const mapEntries = computed(() => ({
  openGraph: sortedEntries(sr.value.openGraph),
  twitter: sortedEntries(sr.value.twitter),
  meta: sortedEntries(sr.value.meta),
}));

const summaryItems = computed(() =>
  [
    { key: 'lang', label: 'Language', value: sr.value.html?.lang },
    { key: 'titleTag', label: 'Title tag', value: sr.value.html?.titleTag },
    { key: 'siteName', label: 'Site name', value: sr.value.derived?.siteName },
    { key: 'type', label: 'Type', value: sr.value.derived?.type },
    { key: 'locale', label: 'Locale', value: sr.value.derived?.locale },
    { key: 'robots', label: 'Robots', value: sr.value.derived?.robots },
    {
      key: 'themeColor',
      label: 'Theme color',
      value: sr.value.derived?.themeColor,
    },
    { key: 'author', label: 'Author', value: sr.value.derived?.author },
    {
      key: 'generator',
      label: 'Generator',
      value: sr.value.derived?.generator,
    },
    { key: 'canonical', label: 'Canonical', value: sr.value.links?.canonical },
    { key: 'manifest', label: 'Manifest', value: sr.value.links?.manifest },
  ].filter((i) => i.value),
);

const groupedData = computed<
  Record<string, { label: string; entries: [string, Meta][] }>
>(() => ({
  openGraph: { label: 'Open Graph', entries: mapEntries.value.openGraph },
  twitter: { label: 'Twitter', entries: mapEntries.value.twitter },
  meta: { label: 'Meta', entries: mapEntries.value.meta },
}));

const tabs = computed(() => [
  { label: 'Preview', value: 'preview' },
  { label: 'Screenshot', value: 'screenshot' },
  ...(mapEntries.value.openGraph.length
    ? [{ label: 'Open Graph', value: 'openGraph' }]
    : []),
  ...(mapEntries.value.twitter.length
    ? [{ label: 'Twitter', value: 'twitter' }]
    : []),
  ...(mapEntries.value.meta.length ? [{ label: 'Meta', value: 'meta' }] : []),
  ...(sr.value.jsonLd?.length ? [{ label: 'JSON-LD', value: 'jsonld' }] : []),
]);

function asList(v: Meta) {
  return Array.isArray(v) ? v : [v];
}
function prettyJson(v: any) {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

async function copy(text: string, key: string) {
  try {
    await navigator.clipboard.writeText(text);
    copied.value = key;
    setTimeout(() => {
      if (copied.value === key) copied.value = null;
    }, 1200);
  } catch (e) {
    console.error('Copy failed', e);
  }
}

function normalizeUrl(input: string) {
  const t = input.trim();
  return t && !/^https?:/i.test(t) ? `https://${t}` : t;
}

async function inspectUrl(forceRefresh = false) {
  const next = normalizeUrl(url.value);
  if (!next) return;
  url.value = next;
  loading.value = true;
  error.value = '';
  try {
    result.value = await $fetch<InspectResult>(
      `/api/fetch?mode=inspect&url=${encodeURIComponent(next)}${forceRefresh ? '&refresh=true' : ''}`,
      { headers },
    );
    activeTab.value = 'preview';
  } catch (e: any) {
    error.value =
      e?.data?.message ?? e?.message ?? 'Could not inspect this URL.';
  } finally {
    loading.value = false;
  }
}

async function loadScreenshot(forceRefresh = false) {
  const next = normalizeUrl(url.value);
  if (!next) return;
  url.value = next;
  loadingShot.value = true;
  screenshotError.value = '';
  try {
    const data = await $fetch<{ url: string }>(
      `/api/fetch?mode=screenshot&url=${encodeURIComponent(next)}${forceRefresh ? '&refresh=true' : ''}`,
      { headers },
    );
    result.value = { ...sr.value, screenshot: data.url };
  } catch (e: any) {
    screenshotError.value =
      e?.data?.message ?? e?.message ?? 'Could not generate screenshot.';
  } finally {
    loadingShot.value = false;
  }
}
</script>

<template>
  <div class="space-y-6 max-w-6xl mx-auto">
    <div>
      <h1 class="text-2xl md:text-3xl font-bold text-white mb-2">
        URL Inspector
      </h1>
      <p class="text-base-400">Check an URL for meta data.</p>
    </div>

    <UCard class="border border-base-800 bg-base-900/50">
      <div class="flex flex-col lg:flex-row gap-3">
        <UInput
          v-model="url"
          size="xl"
          variant="subtle"
          placeholder="https://example.com"
          class="flex-1 transition-all focus:ring-2 focus:ring-secondary-500"
          @keyup.enter="inspectUrl(false)"
        />
        <div class="flex gap-3">
          <UButton
            color="primary"
            size="xl"
            :loading="loading"
            :disabled="loading || loadingShot"
            @click="inspectUrl(false)"
            >Inspect</UButton
          >
          <UButton
            variant="soft"
            color="neutral"
            size="xl"
            :loading="loading"
            :disabled="!hasResult || loading || loadingShot"
            @click="inspectUrl(true)"
            >Refresh meta</UButton
          >
        </div>
      </div>
      <p v-if="error" class="text-sm text-error-400 mt-3">{{ error }}</p>
    </UCard>

    <template v-if="hasResult">
      <UTabs
        v-model="activeTab"
        :items="tabs"
        color="primary"
        variant="link"
        class="overflow-x-auto"
      />

      <section v-if="activeTab === 'preview'" class="space-y-6">
        <div class="flex flex-col lg:flex-row gap-6 items-start">
          <div class="w-full lg:flex-1 min-w-0">
            <UCard
              class="border border-base-800 bg-base-900/50 overflow-hidden"
            >
              <div class="bg-base-950 border-b border-base-800">
                <img
                  v-if="sr.image"
                  :src="sr.image"
                  alt="Open Graph image"
                  class="w-full aspect-[1.91/1] object-cover"
                />
                <div
                  v-else
                  class="w-full aspect-[1.91/1] flex items-center justify-center"
                >
                  <UIcon
                    name="i-heroicons-photo"
                    class="size-10 text-base-700"
                  />
                </div>
              </div>
              <div class="p-3 space-y-0.5 border-t border-base-800 bg-base-900">
                <p
                  class="text-xs uppercase tracking-wider text-base-500 font-medium"
                >
                  {{ cleanHost }}
                </p>
                <p
                  class="text-sm font-semibold text-white leading-snug line-clamp-2"
                >
                  {{ sr.title }}
                </p>
                <p
                  v-if="sr.description"
                  class="text-xs text-base-400 line-clamp-2 leading-relaxed"
                >
                  {{ sr.description }}
                </p>
              </div>
              <div
                class="px-3 py-2 flex items-center gap-2 border-t border-base-800"
              >
                <img
                  v-if="sr.favicon"
                  :src="sr.favicon"
                  class="size-4 object-contain shrink-0"
                  alt=""
                />
                <UIcon
                  v-else
                  name="i-heroicons-globe-alt"
                  class="size-4 text-base-500 shrink-0"
                />
                <p class="text-xs text-primary-300 font-mono truncate">
                  {{ sr.url }}
                </p>
              </div>
            </UCard>
          </div>

          <div class="w-full lg:w-80 shrink-0">
            <UCard class="border border-base-800 bg-base-900/50">
              <template #header
                ><h2
                  class="text-sm font-semibold uppercase tracking-wider text-white"
                >
                  Quick info
                </h2></template
              >
              <div class="space-y-3">
                <div
                  v-for="item in summaryItems"
                  :key="item.key"
                  class="rounded-lg border border-base-800 bg-base-950/60 p-3"
                >
                  <div class="flex items-center justify-between gap-3 mb-1">
                    <p class="text-xs uppercase tracking-wider text-base-500">
                      {{ item.label }}
                    </p>
                  </div>
                  <p class="text-sm text-base-200 break-all">
                    {{ item.value }}
                  </p>
                </div>
              </div>
            </UCard>
          </div>
        </div>

        <UCard
          v-if="sr.links?.icons?.length"
          class="border border-base-800 bg-base-900/50"
        >
          <template #header
            ><h2
              class="text-sm font-semibold uppercase tracking-wider text-white"
            >
              Icons
            </h2></template
          >
          <div class="space-y-3">
            <div
              v-for="(icon, i) in sr.links.icons"
              :key="i"
              class="rounded-lg border border-base-800 bg-base-950/60 p-3 flex gap-3 items-start"
            >
              <div
                class="size-12 rounded-lg border border-base-800 bg-base-900/80 flex items-center justify-center overflow-hidden shrink-0"
              >
                <img :src="icon.href" class="size-6 object-contain" alt="" />
              </div>
              <div class="min-w-0 flex-1 space-y-1">
                <p class="text-sm text-base-200 break-all">{{ icon.href }}</p>
                <div class="flex flex-wrap gap-2 text-xs text-base-500">
                  <span v-if="icon.rel">rel {{ icon.rel }}</span>
                  <span v-if="icon.sizes">sizes {{ icon.sizes }}</span>
                  <span v-if="icon.type">type {{ icon.type }}</span>
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <UCard
          v-if="sr.links?.alternates?.length"
          class="border border-base-800 bg-base-900/50"
        >
          <template #header
            ><h2
              class="text-sm font-semibold uppercase tracking-wider text-white"
            >
              Alternate links
            </h2></template
          >
          <div class="space-y-3">
            <div
              v-for="(item, i) in sr.links.alternates"
              :key="i"
              class="rounded-lg border border-base-800 bg-base-950/60 p-3 flex items-start gap-3"
            >
              <div class="flex-1 min-w-0 space-y-1">
                <p class="text-sm text-base-200 break-all">{{ item.href }}</p>
                <div class="flex flex-wrap gap-2 text-xs text-base-500">
                  <span v-if="item.hreflang">hreflang {{ item.hreflang }}</span>
                  <span v-if="item.title">title {{ item.title }}</span>
                  <span v-if="item.media">media {{ item.media }}</span>
                  <span v-if="item.type">type {{ item.type }}</span>
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <UCard
          v-if="sr.links?.feeds?.length"
          class="border border-base-800 bg-base-900/50"
        >
          <template #header
            ><h2
              class="text-sm font-semibold uppercase tracking-wider text-white"
            >
              Feeds
            </h2></template
          >
          <div class="space-y-3">
            <div
              v-for="(feed, i) in sr.links.feeds"
              :key="i"
              class="rounded-lg border border-base-800 bg-base-950/60 p-3 flex items-start gap-3"
            >
              <div class="flex-1 min-w-0 space-y-1">
                <p class="text-sm text-base-200 break-all">{{ feed.href }}</p>
                <div class="flex flex-wrap gap-2 text-xs text-base-500">
                  <span v-if="feed.title">title {{ feed.title }}</span>
                  <span v-if="feed.type">type {{ feed.type }}</span>
                </div>
              </div>
            </div>
          </div>
        </UCard>
      </section>

      <section v-else-if="activeTab === 'screenshot'">
        <UCard class="border border-base-800 bg-base-900/50">
          <template #header>
            <div class="flex items-center justify-between gap-3">
              <h2
                class="text-sm font-semibold uppercase tracking-wider text-white"
              >
                Screenshot
              </h2>
              <UButton
                v-if="sr.screenshot"
                variant="ghost"
                color="neutral"
                :loading="loadingShot"
                @click="loadScreenshot(true)"
                >Refresh</UButton
              >
            </div>
          </template>
          <div
            class="rounded-lg overflow-hidden border border-base-800 bg-base-900/80 aspect-video flex items-center justify-center"
          >
            <img
              v-if="sr.screenshot"
              :src="sr.screenshot"
              alt="Website screenshot"
              class="w-full h-full object-cover"
            />
            <div
              v-else
              class="flex flex-col items-center justify-center gap-4 p-6 text-center"
            >
              <UIcon
                name="i-heroicons-computer-desktop"
                class="size-8 text-base-600"
              />
              <p class="text-sm text-base-400">
                Load a visual preview of the current page.
              </p>
              <UButton
                color="primary"
                variant="soft"
                :loading="loadingShot"
                :disabled="loading"
                @click="loadScreenshot(false)"
                >Generate screenshot</UButton
              >
            </div>
          </div>
          <p v-if="screenshotError" class="text-sm text-error-400 mt-3">
            {{ screenshotError }}
          </p>
        </UCard>
      </section>

      <section v-else-if="groupedData[activeTab]">
        <UCard class="border border-base-800 bg-base-900/50">
          <template #header
            ><h2
              class="text-sm font-semibold uppercase tracking-wider text-white"
            >
              {{ groupedData[activeTab].label }}
            </h2></template
          >
          <div
            v-if="!groupedData[activeTab].entries.length"
            class="text-sm text-base-400 text-center py-4"
          >
            No data found.
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="[key, value] in groupedData[activeTab].entries"
              :key="key"
              class="rounded-lg border border-base-800 bg-base-950/60 p-3"
            >
              <p class="text-xs uppercase tracking-wider text-base-500 mb-2">
                {{ key }}
              </p>
              <div class="space-y-2">
                <div
                  v-for="(val, j) in asList(value)"
                  :key="j"
                  class="flex items-start gap-2"
                >
                  <p class="text-sm text-base-200 break-all flex-1">
                    {{ val }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </UCard>
      </section>

      <section v-else-if="activeTab === 'jsonld'">
        <UCard class="border border-base-800 bg-base-900/50">
          <template #header
            ><h2
              class="text-sm font-semibold uppercase tracking-wider text-white"
            >
              JSON-LD
            </h2></template
          >
          <div class="space-y-3">
            <div
              v-for="(item, i) in sr.jsonLd"
              :key="i"
              class="rounded-lg border border-base-800 bg-base-950/60 p-3"
            >
              <div class="flex items-center justify-between gap-3 mb-2">
                <p class="text-xs uppercase tracking-wider text-base-500">
                  Block {{ i + 1 }}
                </p>
              </div>
              <pre
                class="text-xs text-base-200 whitespace-pre-wrap break-words font-mono overflow-x-auto"
                >{{ prettyJson(item) }}</pre
              >
            </div>
          </div>
        </UCard>
      </section>
    </template>
  </div>
</template>
