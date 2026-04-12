<script setup lang="ts">
type Flavor = 'lorem' | 'starwars' | 'cthulhu' | 'corporate' | 'cyberpunk';
type Unit = 'paragraphs' | 'sentences' | 'words';

const WORDS: Record<Flavor, string[]> = {
  lorem:
    'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum'.split(
      ' ',
    ),
  starwars:
    'jedi sith lightsaber wookiee padawan coruscant tatooine hoth endor naboo force darkside rebel empire stormtrooper droid bantha ewok yoda vader skywalker kenobi solo chewbacca millennium falcon xwing tiefighter deathstar hyperspace lightspeed bounty hunter cantina mandalorian kyber crystal holocron dagobah alderaan kamino geonosis republic senate clone trooper blaster'.split(
      ' ',
    ),
  cthulhu:
    'cthulhu nyarlathotep shoggoth eldritch cyclopean non-euclidean stygian tenebrous antediluvian miasmic unspeakable gibbering squamous rugose tentacled iridescent abyssal fathomless primordial arcane forbidden dread cursed madness whispers shadows dreams nightmare awakening rising ancient ones old gods innsmouth arkham miskatonic necronomicon dagon hastur yog-sothoth azathoth ia fhtagn'.split(
      ' ',
    ),
  corporate:
    'synergy leverage stakeholder actionable bandwidth scalable paradigm disruptive agile pivot ideate circle back touch base deep dive low-hanging fruit move the needle boil the ocean bleeding edge mission critical core competency value add deliverable roadmap alignment cadence runway burn rate north star moving forward win-win granular holistic ecosystem vertical streamline optimize iterate strategic incentivize operationalize rightsize downsize'.split(
      ' ',
    ),
  cyberpunk:
    'neon chrome datastream netrunner synthwave cybernetic implant augment wetware meatspace ICE daemon protocol encrypted mainframe terminal deck jack uplink biotech nanotech megacorp arcology sprawl dystopia rain-slick noir hologram neural interface grid matrix zaibatsu samurai ronin fixer decker corpo edgerunner nomad ripper street cred chipped wired glitch static signal'.split(
      ' ',
    ),
};

const flavor = ref<Flavor>('lorem');
const unit = ref<Unit>('paragraphs');
const count = ref(5);
const startWithLorem = ref(true);
const wrapHtml = ref(false);
const copied = ref(false);

const flavorItems = [
  { label: 'Lorem', value: 'lorem' },
  { label: 'Star Wars', value: 'starwars' },
  { label: 'Cthulhu', value: 'cthulhu' },
  { label: 'Corporate', value: 'corporate' },
  { label: 'Cyberpunk', value: 'cyberpunk' },
];

const unitItems = [
  { label: 'Paragraphs', value: 'paragraphs' },
  { label: 'Sentences', value: 'sentences' },
  { label: 'Words', value: 'words' },
];

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function capitalize(s: string) {
  return s[0]!.toUpperCase() + s.slice(1);
}

const CONNECTIVES =
  'the and but or so yet when while where after before until as if whence then this that these thus with from into onto upon over under through between among against toward beyond within of in on at by for about like near during without across around behind'.split(
    ' ',
  );

function themedWord(pool: string[]) {
  return Math.random() < 0.4 ? pick(pool) : pick(CONNECTIVES);
}

function makeSentence(pool: string[], themed: boolean) {
  const length = randInt(6, 16);
  const words = Array.from({ length }, () =>
    themed ? themedWord(pool) : pick(pool),
  );
  return capitalize(words.join(' ')) + pick(['.', '.', '.', '.', '?', '!']);
}

function makeParagraph(pool: string[], themed: boolean) {
  const length = randInt(3, 7);
  return Array.from({ length }, () => makeSentence(pool, themed)).join(' ');
}

const output = ref('');

function generate() {
  const pool = WORDS[flavor.value];
  const themed = flavor.value !== 'lorem';
  const n = Math.max(1, Math.min(count.value, 200));

  if (unit.value === 'words') {
    const words = Array.from({ length: n }, () =>
      themed ? themedWord(pool) : pick(pool),
    );
    if (startWithLorem.value && flavor.value === 'lorem') {
      words.splice(0, 5, 'Lorem', 'ipsum', 'dolor', 'sit', 'amet');
    } else {
      words[0] = capitalize(words[0]!);
    }
    output.value = words.join(' ') + '.';
    return;
  }

  if (unit.value === 'sentences') {
    const sentences = Array.from({ length: n }, () =>
      makeSentence(pool, themed),
    );
    if (startWithLorem.value && flavor.value === 'lorem') {
      sentences[0] =
        'Lorem ipsum dolor sit amet, ' + sentences[0]!.toLowerCase();
    }
    output.value = sentences.join(' ');
    return;
  }

  const paragraphs = Array.from({ length: n }, () =>
    makeParagraph(pool, themed),
  );
  if (startWithLorem.value && flavor.value === 'lorem') {
    paragraphs[0] =
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' +
      paragraphs[0];
  }

  output.value = wrapHtml.value
    ? paragraphs.map((p) => `<p>${p}</p>`).join('\n')
    : paragraphs.join('\n\n');
}

generate();

async function copy() {
  try {
    await navigator.clipboard.writeText(output.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  } catch {
    // noop
  }
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <h1 class="text-2xl md:text-3xl font-bold text-white mb-1">
        Lorem Ipsum Generator
      </h1>
      <p class="text-base-400">Generate placeholder text in a few flavors.</p>
    </div>

    <div class="flex flex-col md:flex-row md:items-end gap-3">
      <UFormField label="Flavor" class="flex-1">
        <USelect
          v-model="flavor"
          :items="flavorItems"
          size="xl"
          class="w-full"
        />
      </UFormField>
      <UFormField label="Unit" class="flex-1">
        <USelect v-model="unit" :items="unitItems" size="xl" class="w-full" />
      </UFormField>
      <UFormField label="Count" class="flex-1">
        <UInput
          v-model.number="count"
          type="number"
          size="xl"
          :min="1"
          :max="200"
          class="w-full"
        />
      </UFormField>
      <UButton color="primary" size="xl" @click="generate"> Generate </UButton>
    </div>

    <div
      v-if="flavor === 'lorem' || unit === 'paragraphs'"
      class="flex flex-wrap gap-x-6 gap-y-2"
    >
      <UCheckbox
        v-if="flavor === 'lorem'"
        v-model="startWithLorem"
        label="Start with 'Lorem ipsum dolor sit amet'"
      />
      <UCheckbox
        v-if="unit === 'paragraphs'"
        v-model="wrapHtml"
        label="Wrap in <p> tags"
      />
    </div>

    <div class="group relative">
      <pre
        class="text-sm bg-base-900 border border-base-800 rounded-lg p-4 overflow-x-auto text-base-200 min-h-[240px] whitespace-pre-wrap"
        >{{ output }}</pre
      >
      <UButton
        :icon="copied ? 'i-heroicons-check' : 'i-heroicons-document-duplicate'"
        color="neutral"
        variant="soft"
        size="xs"
        class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
        aria-label="Copy output"
        @click="copy"
      />
    </div>
  </div>
</template>
