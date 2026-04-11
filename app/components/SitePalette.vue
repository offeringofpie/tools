<script setup lang="ts">
import type { CommandPaletteGroup } from '@nuxt/ui';

const { groups } = useTools();
const router = useRouter();
const open = defineModel<boolean>('open', { default: false });

const commandGroups = computed<CommandPaletteGroup[]>(() =>
  Object.entries(groups).map(([category, tools]) => ({
    id: category.toLowerCase(),
    label: category,
    items: tools.map((t) => ({
      label: t.label,
      icon: t.icon,
      suffix: t.description,
      to: t.to,
      onSelect() {
        router.push(t.to);
        open.value = false;
      },
    })),
  })),
);

defineShortcuts({
  meta_k: () => (open.value = !open.value),
  ctrl_k: () => (open.value = !open.value),
  '?': () => (open.value = !open.value),
  ',': () => (open.value = !open.value),
});
</script>

<template>
  <UModal v-model:open="open" :ui="{ content: 'p-0 overflow-hidden' }">
    <template #content>
      <UCommandPalette
        placeholder="Search tools…"
        :groups="commandGroups"
        size="xl"
        autofocus
        @update:model-value="open = false"
      />
    </template>
  </UModal>
</template>
