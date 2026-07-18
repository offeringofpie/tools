<script setup lang="ts">
import {
  breakpointsTailwind,
  useBreakpoints,
  useLocalStorage,
} from '@vueuse/core';
import type { BreadcrumbItem, NavigationMenuItem } from '#ui/types';

const { groups, registry, colours } = useTools();
const breakpoints = useBreakpoints(breakpointsTailwind);
const isDesktop = breakpoints.greaterOrEqual('lg');
const config = useRuntimeConfig();

const sidebarPref = useLocalStorage('sidebar-open', true);
const open = ref(true);
const ready = ref(false);
const route = useRoute();
const paletteOpen = ref(false);
const main = ref<HTMLElement | null>(null);

const isRail = (state: string) => {
  return isDesktop.value && state === 'collapsed';
};

function toggleSidebar() {
  if (!isDesktop.value) return;
  open.value = !open.value;
}

onMounted(() => {
  if (isDesktop.value) open.value = sidebarPref.value;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      ready.value = true;
    });
  });
});

watch(open, (value) => {
  if (ready.value && isDesktop.value) sidebarPref.value = value;
});

defineShortcuts({
  meta_b: toggleSidebar,
  ctrl_b: toggleSidebar,
});

const sidebarUi = computed(() => {
  return {
    container: [
      'lg:relative lg:inset-auto lg:translate-x-0 lg:h-full border-r border-base-800 bg-bg',
      ready.value ? '' : 'transition-none',
    ],
    gap: ready.value ? '' : 'transition-none',
    header: 'group-data-[state=collapsed]/sidebar:px-2',
    body: 'group-data-[state=collapsed]/sidebar:px-2',
  };
});

const navUi = (category: string, rail: boolean) => {
  return {
    link: rail
      ? 'p-1.5 overflow-hidden justify-center'
      : 'p-1.5 overflow-hidden',
    linkLeadingIcon: `${colours(category).text} opacity-60 group-data-[active]:opacity-100 group-data-[active]:text-primary`,
    linkLabel: rail
      ? `${colours(category).activeText} sr-only block`
      : colours(category).activeText,
  };
};

watch(
  () => route.path,
  () => {
    if (!isDesktop.value) open.value = false;
    if (main.value) main.value.scrollTop = 0;
  },
);

const tool = computed(() => registry[route.path]);

const title = computed(() => {
  if (route.path === '/') return 'Home';
  return tool.value?.label ?? 'Not Found';
});

const breadcrumb = computed<BreadcrumbItem[]>(() => {
  if (!tool.value) return [];
  const items: BreadcrumbItem[] = [
    { label: 'Tools', to: '/', icon: 'i-heroicons-home' },
  ];
  if (tool.value.category) items.push({ label: tool.value.category });
  items.push({ label: tool.value.label });
  return items;
});

const repo = computed(() => {
  const base = 'https://github.com/offeringofpie/tools';
  return tool.value?.file
    ? `${base}/blob/main/app/components/global/${tool.value.file}.vue`
    : base;
});

const siteUrl = computed(() => config.public.siteUrl.replace(/\/$/, ''));

const ogImage = computed(
  () => `https://jlopes.eu/og/tools/${route.path.slice(1)}.jpg`,
);

const seoDescription = computed(() => {
  return tool.value?.seoDescription ?? tool.value?.description;
});

useSeoMeta({
  title: () => tool.value?.seoTitle ?? tool.value?.label,
  ogTitle: () => (tool.value ? `${tool.value.label} - JL Tools` : undefined),
  description: () => seoDescription.value,
  ogDescription: () => seoDescription.value,
  ogImage: () => (tool.value ? ogImage.value : undefined),
  twitterCard: 'summary_large_image',
  twitterImage: () => (tool.value ? ogImage.value : undefined),
});

useHead(
  computed(() => ({
    meta: [{ name: 'author', content: 'J Lopes' }],
    script: tool.value
      ? [
          {
            type: 'application/ld+json',
            innerHTML: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: tool.value.label,
              description: seoDescription.value,
              applicationCategory: 'UtilitiesApplication',
              operatingSystem: 'Web',
              url: `${siteUrl.value}${route.path}`,
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
              author: {
                '@type': 'Person',
                name: 'J Lopes',
                url: 'https://jlopes.eu',
              },
            }),
          },
        ]
      : [],
  })),
);

const home: NavigationMenuItem = {
  label: 'Hello',
  icon: 'i-heroicons-home',
  to: '/',
};
</script>

<template>
  <div class="flex flex-col h-screen w-full bg-bg text-base-50">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:z-100 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-bg focus:text-base-50 focus:rounded focus:ring-2 focus:ring-primary"
    >
      Skip to content
    </a>

    <SiteHeader />

    <div class="flex flex-1 overflow-hidden w-full bg-bg text-base-50">
      <USidebar
        id="tool-sidebar"
        v-model:open="open"
        collapsible="icon"
        side="left"
        class="lg:shrink-0"
        :ui="sidebarUi"
      >
        <template #header="{ state }">
          <div class="w-full">
            <div
              class="flex items-center justify-between w-full px-2 py-2 lg:hidden"
            >
              <UButton
                icon="i-heroicons-x-mark"
                color="neutral"
                variant="ghost"
                aria-label="Close sidebar"
                @click="open = false"
              />
            </div>
            <div
              :class="isRail(state) ? 'flex justify-center pb-2' : 'px-2 pb-2'"
            >
              <UTooltip
                text="Search tools"
                :kbds="['meta', 'k']"
                :disabled="!isRail(state)"
              >
                <UButton
                  color="neutral"
                  variant="subtle"
                  icon="i-heroicons-magnifying-glass"
                  :square="isRail(state)"
                  :class="
                    isRail(state)
                      ? ''
                      : 'w-full justify-start font-normal text-base-400'
                  "
                  aria-label="Search tools"
                  @click="paletteOpen = true"
                >
                  <template v-if="!isRail(state)">
                    <span class="flex-1 text-left">Search tools…</span>
                    <span class="hidden lg:flex items-center gap-0.5">
                      <UKbd value="meta" size="sm" />
                      <UKbd value="k" size="sm" />
                    </span>
                  </template>
                </UButton>
              </UTooltip>
            </div>
          </div>
        </template>

        <template #default="{ state }">
          <div
            :class="[
              'flex-1 overflow-y-auto py-2 space-y-4 custom-scrollbar',
              isRail(state) ? 'px-0' : 'px-2',
            ]"
          >
            <UNavigationMenu
              :items="[home]"
              orientation="vertical"
              aria-label="Home"
              :collapsed="isRail(state)"
              tooltip
              :ui="{
                link: isRail(state)
                  ? 'p-1.5 overflow-hidden justify-center'
                  : 'p-1.5 overflow-hidden',
                linkLabel: isRail(state) ? 'sr-only block' : '',
              }"
            />

            <div
              v-for="(links, category) in groups"
              :key="category"
              class="space-y-2"
            >
              <USeparator class="my-2 border-base-800" />
              <h3
                v-if="!isRail(state)"
                :class="[
                  'px-2 text-xs font-semibold uppercase tracking-wider',
                  colours(category).text,
                ]"
              >
                {{ category }}
              </h3>
              <UNavigationMenu
                :items="links"
                color="primary"
                orientation="vertical"
                :aria-label="`${category} tools`"
                :collapsed="isRail(state)"
                tooltip
                :ui="navUi(category, isRail(state))"
              />
            </div>
          </div>
        </template>
      </USidebar>

      <div class="flex-1 flex flex-col overflow-hidden bg-bg">
        <div
          class="h-16 shrink-0 flex items-center gap-3 px-4 bg-bg border-b border-base-800"
        >
          <UButton
            icon="i-heroicons-bars-3"
            color="neutral"
            variant="ghost"
            :aria-label="open ? 'Close sidebar' : 'Open sidebar'"
            :aria-expanded="open"
            aria-controls="tool-sidebar"
            class="lg:hidden"
            @click="open = !open"
          />

          <UTooltip
            :text="open ? 'Collapse sidebar' : 'Expand sidebar'"
            :kbds="['meta', 'b']"
          >
            <UButton
              :icon="
                open ? 'i-lucide-panel-left-close' : 'i-lucide-panel-left-open'
              "
              color="neutral"
              variant="ghost"
              :aria-label="open ? 'Collapse sidebar' : 'Expand sidebar'"
              aria-controls="tool-sidebar"
              class="hidden lg:inline-flex"
              @click="toggleSidebar"
            />
          </UTooltip>

          <ULink
            to="https://jlopes.eu"
            aria-label="Go to jlopes.eu"
            class="md:hidden shrink-0"
          >
            <SiteLogo
              class="size-11 text-primary hover:text-secondary transition-colors"
            />
          </ULink>

          <span
            v-if="route.path !== '/'"
            class="text-sm font-medium text-base-400 lg:hidden truncate"
          >
            {{ title }}
          </span>

          <UBreadcrumb
            v-if="breadcrumb.length"
            :items="breadcrumb"
            class="hidden lg:flex min-w-0"
          />

          <UTooltip :text="`View ${title} source on GitHub`" class="ml-auto">
            <UButton
              v-if="route.path !== '/'"
              :to="repo"
              target="_blank"
              color="primary"
              variant="ghost"
              size="sm"
              icon="i-lucide-github"
              :aria-label="`View ${title} source on GitHub`"
            >
              <span class="hidden lg:inline">Source</span>
            </UButton>
          </UTooltip>
        </div>

        <main
          id="main-content"
          ref="main"
          class="flex-1 p-4 md:p-8 overflow-y-auto custom-scrollbar"
        >
          <div class="max-w-6xl mx-auto">
            <slot />
          </div>
          <footer
            class="max-w-6xl mx-auto mt-12 pt-4 border-t border-base-800 text-sm text-base-400"
          >
            Built by
            <ULink
              raw
              to="https://jlopes.eu"
              class="text-primary hover:text-secondary transition-colors"
            >
              J Lopes
            </ULink>
          </footer>
        </main>
      </div>
    </div>

    <SitePalette v-model:open="paletteOpen" />
  </div>
</template>
