<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface IpData {
  ip: string;
  city: string;
  region: string;
  country_name: string;
  country_code: string;
  org: string;
  timezone: string;
  latitude: number;
  longitude: number;
}

const ipData = ref<IpData | null>(null);
const ipLoading = ref(false);
const ipError = ref('');

async function fetchIp() {
  ipLoading.value = true;
  ipError.value = '';
  try {
    const r = await fetch('https://ipapi.co/json/');
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    ipData.value = await r.json();
  } catch (e) {
    ipError.value = e instanceof Error ? e.message : 'Failed to fetch IP info.';
  } finally {
    ipLoading.value = false;
  }
}

onMounted(fetchIp);
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold text-white mb-1">My IP</h1>
        <p class="text-base-400">Your public IP and network info.</p>
      </div>
      <UButton
        variant="soft"
        color="neutral"
        icon="i-heroicons-arrow-path"
        :loading="ipLoading"
        @click="fetchIp"
      >
        Refresh
      </UButton>
    </div>

    <UAlert
      v-if="ipError"
      color="error"
      variant="soft"
      :title="ipError"
      icon="i-heroicons-exclamation-circle"
    />

    <UCard class="border border-base-800 bg-base-900/50">
      <div class="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p class="text-xs uppercase tracking-widest text-base-500 mb-1">
            Public IP Address
          </p>
          <div v-if="ipLoading" class="flex items-center gap-2 text-base-500">
            <UIcon name="i-heroicons-arrow-path" class="size-4 animate-spin" />
            <span class="text-sm">Fetching…</span>
          </div>
          <p v-else class="text-3xl font-mono font-bold text-white">
            {{ ipData?.ip ?? '—' }}
          </p>
        </div>
      </div>
    </UCard>

    <div
      v-if="ipData"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <UCard
        v-for="item in [
          {
            label: 'ISP / Org',
            value: ipData.org,
            icon: 'i-heroicons-building-office-2',
          },
          { label: 'City', value: ipData.city, icon: 'i-heroicons-map-pin' },
          { label: 'Region', value: ipData.region, icon: 'i-heroicons-map' },
          {
            label: 'Country',
            value: `${ipData.country_name} (${ipData.country_code})`,
            icon: 'i-heroicons-flag',
          },
          {
            label: 'Timezone',
            value: ipData.timezone,
            icon: 'i-heroicons-clock',
          },
          {
            label: 'Coordinates',
            value: `${ipData.latitude}, ${ipData.longitude}`,
            icon: 'i-heroicons-globe-alt',
          },
        ]"
        :key="item.label"
        class="border border-base-800 bg-base-900/50"
      >
        <div class="flex items-start gap-3">
          <UIcon
            :name="item.icon"
            class="size-4 text-primary-400 mt-0.5 shrink-0"
          />
          <div class="min-w-0">
            <p class="text-xs text-base-500 mb-0.5">{{ item.label }}</p>
            <p class="text-sm text-base-100 font-medium break-all">
              {{ item.value || '—' }}
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <div class="flex items-center justify-center gap-1.5 pt-2">
      <p class="text-xs text-base-600">
        Data provided by
        <ULink
          to="https://ipapi.co"
          target="_blank"
          rel="noopener noreferrer"
          class="text-base-500 hover:text-base-300 underline underline-offset-2 transition-colors"
        >
          ipapi.co
        </ULink>
      </p>
    </div>
  </div>
</template>
