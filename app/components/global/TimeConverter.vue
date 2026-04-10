<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useIntervalFn } from '@vueuse/core';

const currentTime = ref<number>(Date.now());
const focusedField = ref<string | null>(null);
const copiedField = ref<string | null>(null);
const userEdits = ref<Record<string, string>>({});

const { pause, resume, isActive } = useIntervalFn(() => {
  currentTime.value = Date.now();
}, 1000);

const isClockRunning = computed(() => isActive.value);

const timezones = ref([
  { label: 'Universal time (UTC)', value: 'UTC' },
  { label: 'Auckland (NZST/NZDT)', value: 'Pacific/Auckland' },
  { label: 'Brussels (CET/CEST)', value: 'Europe/Brussels' },
  { label: 'Chicago (CST/CDT)', value: 'America/Chicago' },
  { label: 'Denver (MST/MDT)', value: 'America/Denver' },
  { label: 'Lisbon (GMT/BST)', value: 'Europe/Lisbon' },
  { label: 'London (GMT/BST)', value: 'Europe/London' },
  { label: 'New York (EST/EDT)', value: 'America/New_York' },
  { label: 'Paris (CET/CEST)', value: 'Europe/Paris' },
  { label: 'San Francisco (PST/PDT)', value: 'America/Los_Angeles' },
  { label: 'Shanghai (CST)', value: 'Asia/Shanghai' },
  { label: 'Sydney (AEST/AEDT)', value: 'Australia/Sydney' },
  { label: 'Tokyo (JST)', value: 'Asia/Tokyo' },
  { label: 'Washington (EST/EDT)', value: 'America/Washington' },
]);

const selectedZone = ref(timezones.value[5].value);

const formFields = [
  { id: 'zoned', label: 'Target Timezone' },
  { id: 'utc', label: 'UTC Time' },
  { id: 'unixSec', label: 'Unix Epoch (Seconds)' },
  { id: 'unixMs', label: 'Unix Epoch (Milliseconds)' },
  { id: 'iso', label: 'ISO 8601' },
  { id: 'swatch', label: 'Swatch Internet Time (@beats)' },
] as const;

const standardFormats = computed(() => {
  const dateObj = new Date(currentTime.value);

  if (isNaN(dateObj.getTime())) {
    return {
      local: 'Invalid',
      utc: 'Invalid',
      zoned: 'Invalid',
      iso: 'Invalid',
      unixSec: 'Invalid',
      unixMs: 'Invalid',
      swatch: 'Invalid',
    };
  }

  return {
    local: formatDate(dateObj),
    utc: formatDate(dateObj, 'UTC'),
    zoned: formatDate(dateObj, selectedZone.value),
    iso: dateObj.toISOString(),
    swatch: getSwatch(dateObj),
    unixSec: Math.floor(dateObj.getTime() / 1000).toString(),
    unixMs: dateObj.getTime().toString(),
  };
});

const alternativeCalendars = computed(() => {
  const dateObj = new Date(currentTime.value);
  if (isNaN(dateObj.getTime())) return [];

  return [
    {
      id: 'jd',
      label: 'Julian Calendar',
      value: getJulian(dateObj),
      description: 'Alternative calendar created in 46 BC.',
    },
    {
      id: 'mayan',
      label: 'Mayan Calendar',
      value: getMayan(dateObj),
      description: 'Base-20 Mayan calendar',
    },
    {
      id: 'hebrew',
      label: 'Hebrew Calendar',
      value: getAltCal(dateObj, 'hebrew'),
      description: 'Calendar used for Jewish religious observances.',
    },
    {
      id: 'persian',
      label: 'Solar Hijri',
      value: getAltCal(dateObj, 'persian'),
      description: 'Astronomical solar calendar used in Afghanistan and Iran.',
    },
    {
      id: 'islamic',
      label: 'Lunar Hijri',
      value: getAltCal(dateObj, 'islamic'),
      description: 'Islamic lunar calendar.',
    },
    {
      id: 'buddhist',
      label: 'Buddhist',
      value: getAltCal(dateObj, 'buddhist'),
      description: 'Lunisolar calendar used in parts of Asia.',
    },
    {
      id: 'discordian',
      label: 'Discordian',
      value: getDiscordian(dateObj),
      description:
        'Discordian or Erisian calendar based on page 00034 of the Principia Discordia.',
    },
    {
      id: 'stardate',
      label: 'Stardate',
      value: getStardate(dateObj),
      description: 'Fictional Star Trek time. Based on the year 2323.',
    },
  ];
});

function resetClock() {
  resume();
  focusedField.value = null;
  currentTime.value = Date.now();
}

function handleFocus(fieldId: string) {
  focusedField.value = fieldId;
  pause();
  userEdits.value = { ...standardFormats.value };
}

function handleInput(fieldId: string, newValue: string) {
  userEdits.value[fieldId] = newValue;

  const parsedTime = parseTime(fieldId, newValue);
  if (!isNaN(parsedTime)) {
    currentTime.value = parsedTime;
  }
}

function handleBlur(event: FocusEvent) {
  const target = event.relatedTarget as HTMLElement;
  if (!target?.closest('button') && !target?.closest('select')) {
    focusedField.value = null;
  }
}

async function copyToClipboard(id: string, value: string) {
  try {
    await navigator.clipboard.writeText(value);
    copiedField.value = id;
    setTimeout(() => {
      if (copiedField.value === id) copiedField.value = null;
    }, 1500);
  } catch (err) {
    console.error('Failed to copy text', err);
  }
}

const getDisplayValue = (id: string) => {
  return focusedField.value === id
    ? userEdits.value[id]
    : standardFormats.value[id as keyof typeof standardFormats.value];
};

onMounted(() => {
  try {
    const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (
      systemTimezone &&
      !timezones.value.some((tz) => tz.value === systemTimezone)
    ) {
      timezones.value.unshift({
        label: `System (${systemTimezone})`,
        value: systemTimezone,
      });
    }
    selectedZone.value = systemTimezone || timezones.value[5].value;
  } catch (error) {
    console.warn('Could not determine system timezone.', error);
  }
});

watch(selectedZone, () => {
  if (focusedField.value === 'zoned') {
    userEdits.value['zoned'] = standardFormats.value.zoned;
  }
});
</script>

<script lang="ts">
export function formatDate(date: Date, timeZone?: string) {
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
      timeZone,
      hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const dictionary = Object.fromEntries(
      parts.map((pt) => [pt.type, pt.value]),
    );

    const hour = dictionary.hour === '24' ? '00' : dictionary.hour;

    return `${dictionary.weekday}, ${dictionary.day} ${dictionary.month} ${dictionary.year}, ${hour}:${dictionary.minute}:${dictionary.second} ${dictionary.timeZoneName}`;
  } catch {
    return 'Invalid Date';
  }
}

export function getSwatch(date: Date) {
  const beats = Math.floor(((date.getTime() + 3600000) % 86400000) / 86400);
  return `@${String(beats).padStart(3, '0')}`;
}

export function parseTime(type: string, value: string) {
  let cleanValue = value.trim();

  if (!cleanValue || type === 'swatch') return NaN;
  if (type === 'unixSec') return parseInt(cleanValue, 10) * 1000;
  if (type === 'unixMs') return parseInt(cleanValue, 10);

  if (/^-?\d{9,10}$/.test(cleanValue)) return parseInt(cleanValue, 10) * 1000;
  if (/^-?\d{12,13}$/.test(cleanValue)) return parseInt(cleanValue, 10);

  const dateRegex =
    /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2}|\d{4})(?:\s+(.*))?$/;
  const match = cleanValue.match(dateRegex);

  if (match) {
    const p1 = parseInt(match[1], 10);
    const p2 = parseInt(match[2], 10);
    let year = match[3];
    const timePart = match[4] || '';

    if (year.length === 2) {
      year = parseInt(year, 10) < 50 ? `20${year}` : `19${year}`;
    }

    let month, day;

    if (p1 > 12) {
      day = match[1];
      month = match[2];
    } else if (p2 > 12) {
      month = match[1];
      day = match[2];
    } else {
      month = match[1];
      day = match[2];
    }
    cleanValue = `${year}/${month.padStart(2, '0')}/${day.padStart(2, '0')}${timePart ? ' ' + timePart : ''}`;
  }

  return Date.parse(cleanValue);
}

export function getJulian(date: Date) {
  const julianDays = date.getTime() / 86400000 + 2440587.5;
  return julianDays.toFixed(5);
}

// based on https://www.fourmilab.ch/documents/calendar/
export function getMayan(date: Date) {
  let daysSince = Math.floor(date.getTime() / 86400000 + 2440588) - 584283;

  if (daysSince < 0) return 'Pre-counting';

  const baktun = Math.floor(daysSince / 144000);
  daysSince %= 144000;

  const katun = Math.floor(daysSince / 7200);
  daysSince %= 7200;

  const tun = Math.floor(daysSince / 360);
  daysSince %= 360;

  const uinal = Math.floor(daysSince / 20);
  const kin = daysSince % 20;

  return `${baktun}.${katun}.${tun}.${uinal}.${kin}`;
}

// Based on https://github.com/zeroturnaround/stardate-converter/blob/master/index.js
export function getStardate(date: Date): string {
  const STAR_TREK_EPOCH = 2323;

  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();

  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const daysInYear = isLeapYear ? 366 : 365;

  const daysPerMonth = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let dayOfYear = daysPerMonth[month] + day - 1;

  if (month >= 2 && isLeapYear) {
    dayOfYear++;
  }

  const fractionalDay =
    dayOfYear + hours / 24 + minutes / 1440 + seconds / 86400;
  const starYear = 1000 * (year - STAR_TREK_EPOCH);
  const starDay = (1000 / daysInYear) * fractionalDay;

  return (starYear + starDay).toFixed(2);
}

// Based on https://rosettacode.org/wiki/Discordian_date#JavaScript
export function getDiscordian(date: Date): string {
  const year = date.getUTCFullYear();
  const YOLD = year + 1166;
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

  const startOfYear = new Date(Date.UTC(year, 0, 0));
  let dayOfYear = Math.floor(
    (date.getTime() - startOfYear.getTime()) / 86400000,
  );

  let celebrateHoliday: string | null = null;

  if (isLeap) {
    if (dayOfYear === 60) {
      celebrateHoliday = "St. Tib's Day";
    } else if (dayOfYear > 60) {
      dayOfYear--;
    }
  }

  dayOfYear--;

  const seasonIndex = Math.floor(dayOfYear / 73);
  const seasonDay = (dayOfYear % 73) + 1;

  const apostles = ['Mungday', 'Mojoday', 'Syaday', 'Zaraday', 'Maladay'];
  const holidays = ['Chaoflux', 'Discoflux', 'Confuflux', 'Bureflux', 'Afflux'];

  if (seasonDay === 5) celebrateHoliday = apostles[seasonIndex];
  if (seasonDay === 50) celebrateHoliday = holidays[seasonIndex];

  const seasons = [
    'Chaos',
    'Discord',
    'Confusion',
    'Bureaucracy',
    'The Aftermath',
  ];
  const weekdays = [
    'Sweetmorn',
    'Boomtime',
    'Pungenday',
    'Prickle-Prickle',
    'Setting Orange',
  ];

  const season = seasons[seasonIndex];
  const weekDay = weekdays[dayOfYear % 5];

  let suffix = 'th';
  if (seasonDay % 10 === 1 && seasonDay !== 11) suffix = 'st';
  else if (seasonDay % 10 === 2 && seasonDay !== 12) suffix = 'nd';
  else if (seasonDay % 10 === 3 && seasonDay !== 13) suffix = 'rd';

  const holiday = celebrateHoliday ? `. Celebrate ${celebrateHoliday}!` : '';

  return `${weekDay}, the ${seasonDay}${suffix} day of ${season} in the YOLD ${YOLD}${holiday}`;
}

export function getAltCal(date: Date, calendar: string) {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      calendar,
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      era: 'short',
    }).format(date);
  } catch {
    return 'Unsupported';
  }
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl md:text-3xl font-bold text-white mb-2">
      Time Converter
    </h1>
    <p class="text-base-400">Convert time between different formats.</p>
    <UCard class="border border-base-800">
      <div class="space-y-6">
        <UFormField>
          <div class="flex items-center gap-3 w-full">
            <UInput
              :model-value="getDisplayValue('local')"
              size="xl"
              class="w-full flex-1 font-mono text-lg font-medium transition-all duration-300 focus:ring-2 focus:ring-secondary-500"
              variant="subtle"
              @update:model-value="handleInput('local', $event)"
              @focus="handleFocus('local')"
              @blur="handleBlur"
            >
              <template #trailing>
                <div
                  v-show="focusedField === 'local' || copiedField === 'local'"
                  class="flex items-center"
                >
                  <UButton
                    v-if="copiedField === 'local'"
                    variant="link"
                    color="success"
                    icon="i-heroicons-check"
                    class="pointer-events-none"
                    :padded="false"
                  />
                  <UButton
                    v-else
                    variant="link"
                    color="neutral"
                    icon="i-heroicons-clipboard-document"
                    class="hover:text-primary focus:text-primary"
                    :padded="false"
                    @click="copyToClipboard('local', standardFormats.local)"
                  />
                </div>
              </template>
            </UInput>

            <UButton
              icon="i-heroicons-arrow-path"
              :color="isClockRunning ? 'neutral' : 'primary'"
              variant="soft"
              size="xl"
              class="shrink-0"
              :disabled="isClockRunning"
              @click="resetClock"
            >
              Reset
            </UButton>
          </div>
        </UFormField>

        <USeparator class="border-base-800" />

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <template v-for="field in formFields" :key="field.id">
            <div v-if="field.id === 'zoned'" class="space-y-2">
              <div class="flex items-center justify-between w-full px-1">
                <label class="block text-sm font-medium text-white">{{
                  field.label
                }}</label>
                <USelect
                  v-model="selectedZone"
                  :items="timezones"
                  size="sm"
                  color="neutral"
                  variant="subtle"
                  @click.stop
                  @mousedown.stop
                />
              </div>
              <UInput
                :model-value="getDisplayValue(field.id)"
                size="lg"
                class="w-full font-mono transition-all focus:ring-2 focus:ring-secondary-500"
                variant="subtle"
                @update:model-value="handleInput(field.id, $event)"
                @focus="handleFocus(field.id)"
                @blur="handleBlur"
              >
                <template #trailing>
                  <div
                    v-show="
                      focusedField === field.id || copiedField === field.id
                    "
                    class="flex items-center"
                  >
                    <UButton
                      v-if="copiedField === field.id"
                      variant="link"
                      color="success"
                      icon="i-heroicons-check"
                      class="pointer-events-none"
                      :padded="false"
                    />
                    <UButton
                      v-else
                      variant="link"
                      color="neutral"
                      icon="i-heroicons-clipboard-document"
                      class="hover:text-primary focus:text-primary"
                      :padded="false"
                      @click="copyToClipboard(field.id, standardFormats.zoned)"
                    />
                  </div>
                </template>
              </UInput>
            </div>

            <UFormField v-else :label="field.label">
              <UInput
                :model-value="getDisplayValue(field.id)"
                :readonly="field.id === 'swatch'"
                size="lg"
                class="w-full font-mono transition-all focus:ring-2 focus:ring-secondary-500"
                variant="subtle"
                @update:model-value="handleInput(field.id, $event)"
                @focus="handleFocus(field.id)"
                @blur="handleBlur"
              >
                <template #trailing>
                  <div
                    v-show="
                      focusedField === field.id || copiedField === field.id
                    "
                    class="flex items-center"
                  >
                    <UButton
                      v-if="copiedField === field.id"
                      variant="link"
                      color="success"
                      icon="i-heroicons-check"
                      class="pointer-events-none"
                      :padded="false"
                    />
                    <UButton
                      v-else
                      variant="link"
                      color="neutral"
                      icon="i-heroicons-clipboard-document"
                      class="hover:text-primary focus:text-primary"
                      :padded="false"
                      @click="
                        copyToClipboard(
                          field.id,
                          standardFormats[
                            field.id as keyof typeof standardFormats
                          ],
                        )
                      "
                    />
                  </div>
                </template>
              </UInput>
            </UFormField>
          </template>
        </div>
      </div>
    </UCard>

    <UCard v-if="alternativeCalendars.length" class="border border-base-800">
      <template #header>
        <h2 class="text-lg font-semibold text-white">Alternative Calendars</h2>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="alt in alternativeCalendars"
          :key="alt.id"
          role="button"
          tabindex="0"
          class="group flex items-center justify-between p-4 rounded-lg bg-base-900/40 border border-base-800 hover:border-primary-500 cursor-pointer transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          @click="copyToClipboard(alt.id, alt.value)"
          @keydown.enter="copyToClipboard(alt.id, alt.value)"
          @keydown.space.prevent="copyToClipboard(alt.id, alt.value)"
        >
          <div class="space-y-0.5">
            <div class="flex items-center gap-1.5">
              <span
                class="text-xs font-semibold text-primary-500 uppercase tracking-wider"
              >
                {{ alt.label }}
              </span>
              <UTooltip :text="alt.description" :popper="{ placement: 'top' }">
                <UIcon
                  name="i-heroicons-information-circle"
                  class="w-4 h-4 text-base-500 hover:text-primary-400 transition-colors"
                  @click.stop
                />
              </UTooltip>
            </div>
            <p class="text-base font-mono text-base-100">{{ alt.value }}</p>
          </div>

          <div class="flex items-center shrink-0 ml-4">
            <UIcon
              :name="
                copiedField === alt.id
                  ? 'i-heroicons-check'
                  : 'i-heroicons-document-duplicate'
              "
              class="size-5 transition-all"
              :class="
                copiedField === alt.id
                  ? 'text-success-500 opacity-100'
                  : 'text-base-400 opacity-0 group-hover:opacity-100 group-hover:text-primary-400'
              "
            />
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>
