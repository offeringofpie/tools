<script setup lang="ts">
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';
import type { NavigationMenuItem } from '#ui/types';

const { groups, registry } = useTools();
const breakpoints = useBreakpoints(breakpointsTailwind);
const isDesktop = breakpoints.greaterOrEqual('md');

const open = ref(false);
const route = useRoute();
const paletteOpen = ref(false);

onMounted(() => {
  if (isDesktop.value) open.value = true;
});

watch(route, () => {
  if (isDesktop.value) open.value = true;
});

watch(isDesktop, (desktop) => {
  open.value = desktop;
});

const title = computed(() => {
  if (route.path === '/') return 'Home';
  return registry[route.path]?.label ?? 'Not Found';
});

const repo = computed(() => {
  const base = 'https://github.com/offeringofpie/tools';
  const file = registry[route.path]?.file;
  return file ? `${base}/blob/main/app/components/global/${file}.vue` : base;
});

const home: NavigationMenuItem = {
  label: 'Hello',
  icon: 'i-heroicons-home',
  to: '/',
};
</script>

<template>
  <div class="flex flex-col h-screen w-full bg-bg text-base-50">
    <SiteHeader />

    <div class="flex flex-1 overflow-hidden w-full bg-bg text-base-50">
      <USidebar
        v-model:open="open"
        variant="default"
        collapsible="offcanvas"
        side="left"
        class="lg:shrink-0"
        :ui="{
          wrapper: 'lg:static',
          container:
            'lg:relative lg:inset-auto lg:translate-x-0 lg:h-full border-r border-base-800 bg-bg',
        }"
      >
        <template #header>
          <div>
            <div class="flex items-center justify-between w-full px-2 py-2">
              <UButton
                icon="i-heroicons-x-mark"
                color="neutral"
                variant="ghost"
                aria-label="Close sidebar"
                class="lg:hidden"
                @click="open = false"
              />
            </div>
            <div class="px-2 pb-2 hidden md:block">
              <UButton
                color="neutral"
                variant="subtle"
                icon="i-heroicons-magnifying-glass"
                class="w-full justify-start font-normal text-base-500"
                aria-label="Search tools"
                @click="paletteOpen = true"
              >
                <span class="flex-1 text-left">Search tools…</span>
                <UKbd value="⌘K" size="sm" class="hidden lg:flex" />
              </UButton>
            </div>
          </div>
        </template>

        <div
          class="flex-1 overflow-y-auto px-2 py-2 space-y-4 custom-scrollbar"
        >
          <UNavigationMenu
            :items="[home]"
            orientation="vertical"
            :ui="{ link: 'p-1.5 overflow-hidden' }"
          />

          <div
            v-for="(links, category) in groups"
            :key="category"
            class="space-y-2"
          >
            <USeparator class="my-2 border-base-800" />
            <h3
              class="px-2 text-xs font-semibold text-base-500 uppercase tracking-wider"
            >
              {{ category }}
            </h3>
            <UNavigationMenu
              :items="links"
              orientation="vertical"
              :aria-label="`${category} tools`"
              :ui="{ link: 'p-1.5 overflow-hidden' }"
            />
          </div>
        </div>
      </USidebar>

      <div class="flex-1 flex flex-col overflow-hidden bg-bg">
        <div
          class="h-16 shrink-0 flex items-center gap-3 px-2 bg-bg border-b border-base-800"
        >
          <UButton
            icon="i-heroicons-bars-3"
            color="neutral"
            variant="ghost"
            :aria-label="open ? 'Close sidebar' : 'Open sidebar'"
            :aria-expanded="open"
            class="lg:hidden"
            @click="open = !open"
          />

          <span
            v-if="route.path !== '/'"
            class="text-sm font-medium text-base-400 lg:hidden truncate"
          >
            {{ title }}
          </span>

          <UTooltip text="View code in GitHub" class="ml-auto">
            <UBanner
              v-if="route.path !== '/'"
              :title="title"
              icon="i-lucide-github"
              :to="repo"
              target="_blank"
              class="bg-transparent! border-none shadow-none hover:opacity-80 transition-opacity"
              :ui="{
                title: '!text-primary-500 font-semibold',
                icon: '!text-primary-500',
              }"
              aria-label="View source code on Github"
            />
          </UTooltip>
        </div>

        <main class="flex-1 p-4 md:p-8 overflow-y-auto custom-scrollbar">
          <div class="max-w-6xl mx-auto">
            <slot />
          </div>
        </main>
      </div>
    </div>

    <SitePalette v-model:open="paletteOpen" />
  </div>
</template>
