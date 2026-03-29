<script setup lang="ts">
import { ref, computed } from 'vue';
import type { NavigationMenuItem } from '@nuxt/ui';

const { groups, registry } = useTools();
const open = ref(true);
const variant = ref('default');
const side = ref('left');
const collapsible = ref('offcanvas');

const route = useRoute();

const title = computed(() => {
  if (route.path === '/') return 'Home';
  return registry[route.path]?.label || 'Not Found';
});

const repo = computed(() => {
  const base = 'https://github.com/offeringofpie/tools';
  const file = registry[route.path]?.file;

  return file ? `${base}/blob/main/app/components/global/${file}.vue` : base;
});

const home: NavigationMenuItem[] = [
  { label: 'Hello', icon: 'i-heroicons-home', to: '/' },
];
</script>

<template>
  <div class="flex flex-col h-screen w-full bg-bg text-base-50">
    <SiteHeader />

    <div
      class="flex flex-1 overflow-hidden w-full bg-bg text-base-50"
      :class="[
        variant === 'inset' && 'bg-bg',
        side === 'right' && 'flex-row-reverse',
      ]"
    >
      <USidebar
        v-model:open="open"
        :variant="variant"
        :collapsible="collapsible"
        :side="side"
        class="lg:shrink-0"
        :ui="{
          wrapper: 'lg:static',
          container:
            'lg:relative lg:inset-auto lg:translate-x-0 lg:h-full border-r border-base-800 bg-bg',
        }"
      >
        <template #header>
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
        </template>

        <div
          class="flex-1 overflow-y-auto px-2 py-2 space-y-4 custom-scrollbar"
        >
          <UNavigationMenu
            :items="home"
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

      <div
        class="flex-1 flex flex-col overflow-hidden lg:peer-data-[variant=floating]:my-4 peer-data-[variant=inset]:m-4 lg:peer-data-[variant=inset]:not-peer-data-[collapsible=offcanvas]:ms-0 peer-data-[variant=inset]:rounded-xl peer-data-[variant=inset]:shadow-sm peer-data-[variant=inset]:ring peer-data-[variant=inset]:ring-base-800 bg-bg"
      >
        <div
          class="h-16 shrink-0 flex items-center bg-bg"
          :class="[
            variant !== 'floating' && 'border-b border-base-800',
            side === 'right' && 'justify-end',
          ]"
        >
          <UButton
            :icon="
              side === 'left'
                ? 'i-heroicons-bars-3'
                : 'i-heroicons-bars-3-bottom-right'
            "
            color="neutral"
            variant="ghost"
            :aria-label="open ? 'Close sidebar' : 'Open sidebar'"
            :aria-expanded="open"
            class="lg:hidden p-4"
            @click="open = !open"
          />
          <UTooltip text="View code in GitHub">
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
              aria-label="View code in Github"
            />
          </UTooltip>
        </div>
        <main class="flex-1 p-4 md:p-8 overflow-y-auto custom-scrollbar">
          <div class="flex-1 p-4 md:p-8 overflow-y-auto custom-scrollbar">
            <div class="max-w-6xl mx-auto">
              <slot />
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>
