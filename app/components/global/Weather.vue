<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  onBeforeUnmount,
  onMounted,
  nextTick,
} from 'vue';
import 'leaflet/dist/leaflet.css';

interface Weather {
  temp: number;
  feelsLike: number;
  humidity: number;
  wind: number;
  windDir: number;
  pressure: number;
  visibility: string;
  label: string;
  emoji: string;
}

interface Day {
  date: string;
  hi: number;
  lo: number;
  label: string;
  emoji: string;
}

interface Place {
  name: string;
  lat: number;
  lon: number;
  country: string;
  region?: string;
}

const unit = ref<'C' | 'F'>('C');

function toF(c: number) {
  return Math.round((c * 9) / 5 + 32);
}
function temp(c: number) {
  return unit.value === 'F' ? toF(c) : Math.round(c);
}

const POPULAR: Place[] = [
  { name: 'London', lat: 51.5074, lon: -0.1278, country: 'GB' },
  { name: 'Lisbon', lat: 38.7223, lon: -9.1393, country: 'PT' },
  { name: 'Ghent', lat: 51.0543, lon: 3.7174, country: 'BE' },
  { name: 'New York', lat: 40.7128, lon: -74.006, country: 'US' },
  { name: 'Richmond', lat: 37.5407, lon: -77.436, country: 'US' },
  { name: 'Chicago', lat: 41.8781, lon: -87.6298, country: 'US' },
  { name: 'Seattle', lat: 47.6062, lon: -122.3321, country: 'US' },
];

const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle');
const errMsg = ref('');
const pos = ref<{ lat: number; lon: number } | null>(null);
const data = ref<any>(null);
const title = ref('');

const query = ref('');
const results = ref<Place[]>([]);
const searching = ref(false);
const tab = ref('now');

const mapEl = ref<HTMLElement | null>(null);
let map: any = null;
let L: any = null;
let timer: ReturnType<typeof setTimeout> | null = null;

const tabs = [
  { label: 'Now', value: 'now' },
  { label: 'Forecast', value: 'forecast' },
  { label: 'Map', value: 'map' },
];

function wmoInfo(code: number) {
  if (code === 0) return { label: 'Clear sky', emoji: '☀️' };
  if (code <= 2) return { label: 'Partly cloudy', emoji: '⛅' };
  if (code === 3) return { label: 'Overcast', emoji: '☁️' };
  if (code <= 49) return { label: 'Fog', emoji: '🌫️' };
  if (code <= 57) return { label: 'Drizzle', emoji: '🌦️' };
  if (code <= 67) return { label: 'Rain', emoji: '🌧️' };
  if (code <= 77) return { label: 'Snow', emoji: '❄️' };
  if (code <= 82) return { label: 'Rain showers', emoji: '🌧️' };
  if (code <= 86) return { label: 'Snow showers', emoji: '🌨️' };
  return { label: 'Thunderstorm', emoji: '⛈️' };
}

const current = computed<Weather | null>(() => {
  if (!data.value) return null;
  const c = data.value.current;
  return {
    temp: temp(c.temperature_2m),
    feelsLike: temp(c.apparent_temperature),
    humidity: c.relative_humidity_2m,
    wind: Math.round(c.wind_speed_10m),
    windDir: c.wind_direction_10m,
    pressure: Math.round(c.surface_pressure),
    visibility: ((c.visibility ?? 0) / 1000).toFixed(1),
    ...wmoInfo(c.weather_code),
  };
});

const forecast = computed<Day[]>(() => {
  if (!data.value) return [];
  const d = data.value.daily;
  return (d.time as string[]).map((date, i) => ({
    date: new Date(date).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
    }),
    hi: temp(d.temperature_2m_max[i]),
    lo: temp(d.temperature_2m_min[i]),
    ...wmoInfo(d.weather_code[i]),
  }));
});

const stats = computed(() => {
  if (!current.value) return [];
  return [
    {
      label: 'Humidity',
      value: `${current.value.humidity}%`,
      icon: 'i-heroicons-beaker',
    },
    {
      label: 'Wind',
      value: `${current.value.wind} km/h`,
      icon: 'i-heroicons-paper-airplane',
    },
    {
      label: 'Pressure',
      value: `${current.value.pressure} hPa`,
      icon: 'i-heroicons-arrow-trending-up',
    },
    {
      label: 'Visibility',
      value: `${current.value.visibility} km`,
      icon: 'i-heroicons-eye',
    },
  ];
});

async function load() {
  if (!pos.value) return;
  status.value = 'loading';
  try {
    const res = await $fetch<any>('/api/weather', {
      params: { lat: pos.value.lat, lon: pos.value.lon },
    });
    data.value = res.weather;
    status.value = 'ready';
  } catch (e: any) {
    errMsg.value = e?.data?.message ?? 'Fetch failed';
    status.value = 'error';
  }
}

async function search() {
  if (timer) clearTimeout(timer);
  if (query.value.length < 2) {
    results.value = [];
    return;
  }
  timer = setTimeout(async () => {
    searching.value = true;
    try {
      const res = await $fetch<any>(
        'https://geocoding-api.open-meteo.com/v1/search',
        {
          params: { name: query.value, count: 5, format: 'json' },
        },
      );
      results.value = (res.results ?? []).map((r: any) => ({
        name: r.name,
        lat: r.latitude,
        lon: r.longitude,
        country: r.country,
        region: r.admin1,
      }));
    } finally {
      searching.value = false;
    }
  }, 300);
}

async function pick(p: Place) {
  pos.value = { lat: p.lat, lon: p.lon };
  title.value = [p.name, p.country].filter(Boolean).join(', ');
  query.value = '';
  results.value = [];
  await load();
}

async function gps(silent = false) {
  if (!navigator.geolocation) {
    if (!silent) {
      errMsg.value = 'Geolocation not supported';
      status.value = 'error';
    }
    return;
  }
  if (!silent) status.value = 'loading';
  navigator.geolocation.getCurrentPosition(
    async ({ coords }) => {
      pos.value = { lat: coords.latitude, lon: coords.longitude };
      title.value = 'Current location';
      await load();
    },
    () =>
      silent
        ? pick(POPULAR[0])
        : ((errMsg.value = 'GPS denied'), (status.value = 'error')),
    { timeout: 5000 },
  );
}

function destroyMap() {
  if (map) {
    map.remove();
    map = null;
  }
}

async function initMap() {
  if (!pos.value || !import.meta.client || !mapEl.value) return;
  if (!L) L = await import('leaflet').catch(() => null);
  if (!L) return;

  if (map) {
    map.setView([pos.value.lat, pos.value.lon], 8);
    map.invalidateSize();
    return;
  }

  map = L.map(mapEl.value, {
    zoomControl: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    maxZoom: 12,
  }).setView([pos.value.lat, pos.value.lon], 7);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap, © CARTO',
    maxZoom: 7,
  }).addTo(map);

  const rv = await $fetch<any>(
    'https://api.rainviewer.com/public/weather-maps.json',
  );
  const frame = rv.radar?.past?.at(-1);
  if (frame) {
    L.tileLayer(
      `https://tilecache.rainviewer.com${frame.path}/256/{z}/{x}/{y}/2/1_1.png`,
      {
        opacity: 0.6,
        maxNativeZoom: 10,
        maxZoom: 20,
        attribution: '© RainViewer',
      },
    ).addTo(map);
  }

  L.circleMarker([pos.value.lat, pos.value.lon], {
    radius: 8,
    fillColor: '#3b82f6',
    color: '#fff',
    weight: 2,
    fillOpacity: 1,
  }).addTo(map);

  await nextTick();
  map.invalidateSize();
}

watch(tab, async (val) => {
  if (val === 'map' && status.value === 'ready') {
    destroyMap();
    await nextTick();
    initMap();
  }
});

watch(status, async (val) => {
  if (tab.value === 'map' && val === 'ready') {
    destroyMap();
    await nextTick();
    initMap();
  }
});

onMounted(() => {
  pick(POPULAR[0] as Place);
});

onBeforeUnmount(destroyMap);
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-4">
    <div class="relative">
      <div class="flex items-center gap-2">
        <UButton
          icon="i-heroicons-map-pin"
          color="primary"
          variant="soft"
          size="xl"
          title="Use current location"
          @click="gps(false)"
        />
        <div class="relative flex-1">
          <UInput
            v-model="query"
            icon="i-heroicons-magnifying-glass"
            placeholder="Search city…"
            size="xl"
            variant="subtle"
            class="text-lg bg-base-900/50 rounded-lg border border-base-800 w-full"
            :loading="searching"
            @input="search"
          />
        </div>
        <UFieldGroup size="sm" orientation="horizontal">
          <UButton
            :variant="unit === 'C' ? 'solid' : 'subtle'"
            color="primary"
            label="°C"
            size="xl"
            @click="unit = 'C'"
          />
          <UButton
            :variant="unit === 'F' ? 'solid' : 'subtle'"
            color="primary"
            label="°F"
            size="xl"
            @click="unit = 'F'"
          />
        </UFieldGroup>
      </div>

      <div
        v-if="results.length"
        class="absolute z-50 w-full mt-2 bg-base-900 border border-base-700 rounded-lg shadow-xl overflow-hidden"
      >
        <button
          v-for="p in results"
          :key="`${p.lat}-${p.lon}`"
          class="w-full px-4 py-3 text-left hover:bg-base-800 flex justify-between items-center transition-colors"
          @click="pick(p)"
        >
          <span class="text-base-100">
            {{ p.name }},
            <span class="text-base-500 text-sm">{{ p.region }}</span>
          </span>
          <span class="text-xs text-base-500">{{ p.country }}</span>
        </button>
      </div>
    </div>

    <UAlert
      v-if="status === 'error'"
      color="error"
      variant="soft"
      :title="errMsg"
      icon="i-heroicons-exclamation-circle"
    />

    <div v-if="title && status !== 'error'" class="px-1 flex justify-between">
      <h2 class="text-2xl font-semibold text-base-100">{{ title }}</h2>
      <div class="flex flex-wrap gap-2 justify-end-safe">
        <button
          v-for="p in POPULAR"
          :key="`p-${p.lat}-${p.lon}`"
          class="px-3 py-1.5 text-sm bg-base-800 hover:bg-base-700 rounded-full transition-colors"
          @click="pick(p)"
        >
          {{ p.name }}
        </button>
      </div>
    </div>

    <div>
      <div class="flex gap-4 border-b border-base-800 mb-6">
        <button
          v-for="t in tabs"
          :key="t.value"
          class="pb-2 px-1 text-sm font-medium transition-all"
          :class="
            tab === t.value
              ? 'text-primary-400 border-b-2 border-primary-400'
              : 'text-base-500 hover:text-base-300'
          "
          @click="tab = t.value"
        >
          {{ t.label }}
        </button>
      </div>

      <div v-show="tab === 'now'">
        <div v-if="status === 'loading'" class="animate-pulse space-y-4">
          <div class="h-32 bg-base-800 rounded-xl" />
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div v-for="i in 4" :key="i" class="h-24 bg-base-800 rounded-xl" />
          </div>
        </div>

        <div v-else-if="status === 'ready' && current" class="space-y-4">
          <UCard class="overflow-hidden" variant="subtle">
            <div class="flex items-center gap-8">
              <span class="text-7xl">{{ current.emoji }}</span>
              <div>
                <div class="flex items-baseline gap-1">
                  <span class="text-6xl font-bold">{{ current.temp }}</span>
                  <span class="text-2xl text-base-500">°{{ unit }}</span>
                </div>
                <div class="text-lg text-base-300">{{ current.label }}</div>
                <div class="text-sm text-base-500">
                  Feels like {{ current.feelsLike }}°{{ unit }}
                </div>
              </div>
            </div>
          </UCard>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <UCard v-for="s in stats" :key="s.label" variant="subtle">
              <div class="flex items-center gap-2 mb-1">
                <UIcon :name="s.icon" class="w-4 h-4 text-base-500" />
                <div class="text-xs text-base-500 uppercase font-bold">
                  {{ s.label }}
                </div>
              </div>
              <div class="text-xl font-semibold">{{ s.value }}</div>
            </UCard>
          </div>
        </div>
      </div>

      <div v-show="tab === 'forecast'">
        <div v-if="status === 'ready'" class="space-y-2">
          <UCard v-for="day in forecast" :key="day.date" variant="subtle">
            <div class="flex items-center justify-between">
              <span class="w-24 text-sm">{{ day.date }}</span>
              <span class="text-2xl">{{ day.emoji }}</span>
              <span class="flex-1 px-4 text-sm text-base-500">{{
                day.label
              }}</span>
              <span class="font-mono"
                >{{ day.hi }}°{{ unit }} / {{ day.lo }}°{{ unit }}</span
              >
            </div>
          </UCard>
        </div>
      </div>

      <div v-show="tab === 'map'">
        <div
          ref="mapEl"
          class="h-120 max-h-full w-full rounded-xl bg-base-900"
        />
      </div>
    </div>
    <div class="flex items-center justify-center gap-1.5 pt-2 flex-wrap">
      <p class="text-xs text-base-600">
        Data provided by
        <ULink
          to="https://open-meteo.com"
          target="_blank"
          rel="noopener noreferrer"
          class="text-base-500 hover:text-base-300 underline underline-offset-2 transition-colors"
        >
          Open-Meteo
        </ULink>
        ·
        <ULink
          to="https://openstreetmap.org"
          target="_blank"
          rel="noopener noreferrer"
          class="text-base-500 hover:text-base-300 underline underline-offset-2 transition-colors"
        >
          OpenStreetMap
        </ULink>
        ·
        <ULink
          to="https://carto.com"
          target="_blank"
          rel="noopener noreferrer"
          class="text-base-500 hover:text-base-300 underline underline-offset-2 transition-colors"
        >
          CARTO
        </ULink>
        ·
        <ULink
          to="https://rainviewer.com"
          target="_blank"
          rel="noopener noreferrer"
          class="text-base-500 hover:text-base-300 underline underline-offset-2 transition-colors"
        >
          RainViewer
        </ULink>
      </p>
    </div>
  </div>
</template>

<style>
.leaflet-control-attribution {
  background-color: rgba(0, 0, 0, 0.8) !important;
  color: #888 !important;
  border-radius: 4px 0 0 0;
}
.leaflet-control-attribution a {
  color: #3b82f6 !important;
}
</style>
