<script setup lang="ts">
import { ref, computed } from 'vue';

const url = ref('');
const utm = ref({
  source: '',
  medium: '',
  campaign: '',
  term: '',
  content: '',
});
const copied = ref(false);

const finalUrl = computed(() => {
  const val = url.value.trim();
  if (!val) return '';

  try {
    const safeUrl = /^https?:\/\//i.test(val) ? val : `https://${val}`;
    const parsed = new URL(safeUrl);
    const search = new URLSearchParams(parsed.search);

    for (const [key, val] of Object.entries(utm.value)) {
      const clean = val.trim();
      if (clean) search.set(`utm_${key}`, clean);
    }

    parsed.search = search.toString();
    return parsed.toString();
  } catch {
    return '';
  }
});

function parseUrl(val: string) {
  url.value = val;
  try {
    const parsed = new URL(val);
    const search = parsed.searchParams;
    let changed = false;

    for (const key of Object.keys(utm.value) as (keyof typeof utm.value)[]) {
      const utmKey = `utm_${key}`;
      if (search.has(utmKey)) {
        utm.value[key] = search.get(utmKey) || '';
        search.delete(utmKey);
        changed = true;
      }
    }

    if (changed) {
      parsed.search = search.toString();
      url.value = parsed.toString();
    }
  } catch {
    // Ignore invalid URLs while typing
  }
}

async function copy() {
  if (!finalUrl.value) return;
  try {
    await navigator.clipboard.writeText(finalUrl.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  } catch (err) {
    console.error('Copy failed', err);
  }
}

function reset() {
  url.value = '';
  utm.value = { source: '', medium: '', campaign: '', term: '', content: '' };
}
</script>

<template>
  <div class="space-y-6 max-w-6xl mx-auto">
    <div class="space-y-2">
      <h1 class="text-2xl md:text-3xl font-bold text-white">UTM Builder</h1>
      <p class="text-base-400">Generate URLs for marketing campaigns.</p>
    </div>

    <div
      class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start"
    >
      <div class="space-y-6">
        <UCard class="border border-base-800 bg-base-900/50">
          <div class="space-y-6">
            <UFormField label="Website URL *">
              <UInput
                :model-value="url"
                placeholder="https://example.com"
                size="xl"
                variant="subtle"
                class="w-full transition-all focus:ring-2 focus:ring-secondary-500"
                @update:model-value="parseUrl"
              />
            </UFormField>

            <USeparator class="border-base-800" />

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <UFormField label="Campaign Source *">
                <UInput
                  v-model="utm.source"
                  placeholder="twitter"
                  size="xl"
                  variant="subtle"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Campaign Medium">
                <UInput
                  v-model="utm.medium"
                  placeholder="social"
                  size="xl"
                  variant="subtle"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Campaign Name">
                <UInput
                  v-model="utm.campaign"
                  placeholder="spring_sale"
                  size="xl"
                  variant="subtle"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Campaign Term">
                <UInput
                  v-model="utm.term"
                  placeholder="running+shoes"
                  size="xl"
                  variant="subtle"
                  class="w-full"
                />
              </UFormField>
            </div>

            <UFormField label="Campaign Content">
              <UInput
                v-model="utm.content"
                placeholder="logolink or textlink"
                size="xl"
                variant="subtle"
                class="w-full"
              />
            </UFormField>
          </div>
        </UCard>
      </div>

      <div class="space-y-6 w-full lg:sticky lg:top-8">
        <UCard class="border border-base-800 bg-base-900/50">
          <template #header>
            <h2
              class="text-sm font-semibold uppercase tracking-wider text-white"
            >
              Generated Link
            </h2>
          </template>

          <div v-if="finalUrl" class="space-y-4">
            <UTooltip text="Open in new tab" class="block">
              <ULink
                :to="finalUrl"
                target="_blank"
                class="block rounded-lg border border-base-800 bg-base-950/60 p-4 font-mono text-sm text-primary-300 hover:border-primary-500/50 hover:bg-base-950 hover:text-primary-400 transition-all break-all group relative pr-10"
              >
                {{ finalUrl }}
                <UIcon
                  name="i-heroicons-arrow-top-right-on-square"
                  class="absolute right-4 top-4 size-4 opacity-50 group-hover:opacity-100 transition-opacity"
                />
              </ULink>
            </UTooltip>

            <UButton
              block
              size="xl"
              :color="copied ? 'success' : 'primary'"
              :icon="
                copied ? 'i-heroicons-check' : 'i-heroicons-document-duplicate'
              "
              @click="copy"
            >
              {{ copied ? 'Copied!' : 'Copy URL' }}
            </UButton>
          </div>

          <div
            v-else
            class="text-sm text-base-500 text-center py-10 px-4 border border-dashed border-base-800 rounded-lg bg-base-950/30"
          >
            Enter an URL and at least one parameter to generate the link.
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
