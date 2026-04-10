<script setup lang="ts">
import cronstrue from 'cronstrue';
import { ref, computed } from 'vue';

const cron = ref('0 4 * * *');
const copied = ref(false);

const presets = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every 5 minutes', value: '*/5 * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Midnight', value: '0 0 * * *' },
  { label: '4 AM daily', value: '0 4 * * *' },
  { label: 'Every Sunday', value: '0 0 * * 0' },
  { label: 'Weekdays', value: '0 0 * * 1-5' },
  { label: '1st of month', value: '0 0 1 * *' },
  { label: 'Dolly Parton', value: '0 9-17 * * 1-5' },
];

const text = computed(() => toText(cron.value));
const error = computed(() => text.value === 'Invalid cron expression');

const tokens = computed(() => {
  const parts = cron.value.trim().split(/\s+/);
  while (parts.length < 5) parts.push('*');
  return parts;
});

function setToken(index: number, val: string) {
  const parts = [...tokens.value];
  parts[index] = val.trim() || '*';
  cron.value = parts.slice(0, 5).join(' ');
}

function setPreset(val: string) {
  cron.value = val;
}

async function copy() {
  if (error.value || !cron.value) return;

  try {
    await navigator.clipboard.writeText(cron.value);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 1000);
  } catch (err) {
    console.error('Failed to copy', err);
  }
}

const fields = [
  { label: 'Minute', hint: '0-59' },
  { label: 'Hour', hint: '0-23' },
  { label: 'Day (Mo)', hint: '1-31' },
  { label: 'Month', hint: '1-12' },
  { label: 'Day (Wk)', hint: '0-6' },
];
</script>
<script lang="ts">
export function toText(val: string): string {
  const str = val.trim();
  if (!str) return 'Enter a cron expression';

  try {
    return cronstrue.toString(str, {
      throwExceptionOnParseError: true,
      use24HourTimeFormat: true,
    });
  } catch {
    return 'Invalid cron expression';
  }
}
</script>

<template>
  <div class="space-y-6 max-w-6xl mx-auto">
    <div class="space-y-6">
      <h1 class="text-2xl md:text-3xl font-bold text-white mb-2">
        Cron Helper
      </h1>
      <p class="text-base-400">Helps setup cronjobs.</p>

      <UCard class="border border-base-800">
        <div class="space-y-8">
          <div
            class="p-6 rounded-lg border transition-colors duration-300 text-center border-primary-500/30"
          >
            <div class="flex flex-col items-center gap-2">
              <p
                class="text-xl md:text-xl font-semibold"
                :class="error ? 'text-error-200' : 'text-white'"
              >
                {{ text }}
              </p>
            </div>
          </div>

          <UFormField>
            <UInput
              v-model="cron"
              size="xl"
              class="w-full font-mono text-2xl transition-all focus:ring-2 focus:ring-secondary-500"
              :class="{ 'ring-2 ring-error-500': error }"
              variant="subtle"
              placeholder="* * * * *"
            >
              <template #trailing>
                <div v-show="!error && cron">
                  <UButton
                    v-if="!copied"
                    variant="ghost"
                    color="neutral"
                    class="focus:text-primary hover:text-primary"
                    icon="i-heroicons-clipboard-document"
                    aria-label="Copy to clipboard"
                    @click="copy"
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

          <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div
              v-for="(field, i) in fields"
              :key="field.label"
              class="space-y-1.5"
              :class="i === 4 ? 'col-span-2 md:col-span-1' : ''"
            >
              <label
                class="block text-xs font-semibold text-base-300 uppercase tracking-wider text-center"
              >
                {{ field.label }}
              </label>
              <UInput
                :model-value="tokens[i]"
                size="lg"
                class="font-mono"
                input-class="text-center text-lg"
                placeholder="*"
                @update:model-value="setToken(i, $event)"
              />
              <span class="block text-[11px] text-base-500 text-center">
                {{ field.hint }}
              </span>
            </div>
          </div>
        </div>
      </UCard>

      <UCard class="border border-base-800">
        <template #header>
          <h2 class="text-sm font-semibold text-white uppercase tracking-wider">
            Quick Recipes
          </h2>
        </template>
        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="p in presets"
            :key="p.value"
            size="sm"
            variant="soft"
            color="neutral"
            class="font-mono text-xs hover:bg-primary-500/20 hover:text-primary-400 border border-base-800 hover:border-primary-500/50 transition-all"
            @click="setPreset(p.value)"
          >
            {{ p.label }}
          </UButton>
        </div>
      </UCard>
    </div>
  </div>
</template>
