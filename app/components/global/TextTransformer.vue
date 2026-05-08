<script setup lang="ts">
import { ref, computed } from 'vue';

const hovered = ref<string | null>(null);
const copied = ref<string | null>(null);
const text = ref('The quick brown fox jumps over the lazy dog');

const zup   = ['̍','̎','̄','̅','̿','̑','̆','̐','͒','͗','͑','̇','̈','͂','̓','̈́','͊','͋','͌','̃','̂','̌','͐','̀','́','̋','̏','̒','̊','̉','̸','͆','̾'];
const zdown = ['̖','̗','̘','̙','̜','̝','̞','̟','̠','̤','̥','̦','̩','̪','̫','̬','̭','̮','̯','̰','̱','̲','̳','̹','̺','̻','̼','ͅ','͇','͈','͉','͍','͎','͓','͔'];

const flip: Record<string, string> = {
  a:'ɐ',b:'q',c:'ɔ',d:'p',e:'ǝ',f:'ɟ',g:'ƃ',h:'ɥ',i:'ᴉ',j:'ɾ',k:'ʞ',l:'l',m:'ɯ',n:'u',o:'o',p:'d',q:'b',r:'ɹ',s:'s',t:'ʇ',u:'n',v:'ʌ',w:'ʍ',x:'x',y:'ʎ',z:'z',
  A:'∀',B:'ᗺ',C:'Ɔ',D:'ᗡ',E:'Ǝ',F:'Ⅎ',G:'פ',H:'H',I:'I',J:'ɾ',K:'ʞ',L:'˥',M:'W',N:'N',O:'O',P:'Ԁ',Q:'Q',R:'ᴚ',S:'S',T:'┴',U:'∩',V:'Λ',W:'M',X:'X',Y:'⅄',Z:'Z',
  '0':'0','1':'Ɩ','2':'ᄅ','3':'Ɛ','4':'ㄣ','5':'ϛ','6':'9','7':'ʌ','8':'8','9':'6',
  '!':'¡','?':'¿',',':'\'','\'':',','.':'˙','(':')',')':'(','"':',',
};

const l33t: Record<string, string> = {
  a:'4',e:'3',i:'1',o:'0',s:'5',t:'7',z:'2',b:'8',
  A:'4',E:'3',I:'1',O:'0',S:'5',T:'7',Z:'2',B:'8',
  '1':'|','2':'Z','3':'E','4':'A','5':'S','6':'b','7':'T','8':'B','0':'O',
};

const morse: Record<string, string> = {
  a:'.-',b:'-...',c:'-.-.',d:'-..',e:'.',f:'..-.',g:'--.',h:'....',i:'..',j:'.---',
  k:'-.-',l:'.-..',m:'--',n:'-.',o:'---',p:'.--.',q:'--.-',r:'.-.',s:'...',t:'-',
  u:'..-',v:'...-',w:'.--',x:'-..-',y:'-.--',z:'--..',
  '1':'.----','2':'..---','3':'...--','4':'....-','5':'.....',
  '6':'-....','7':'--...','8':'---..','9':'----.','0':'-----',
  '.':'.-.-.-',',':'--..--','?':'..--..','!':'-.-.--','/':'-..-.','(':'-.--.',')':'-.--.-',
  '&':'.-...',  '@':'.--.-.', ' ':' ',
};

function zalgo(s: string) {
  return s.split('').map(c => {
    if (c === ' ') return c;
    let r = c;
    const n = Math.floor(Math.random() * 5) + 4;
    for (let i = 0; i < n; i++) r += zup[Math.floor(Math.random() * zup.length)];
    for (let i = 0; i < n; i++) r += zdown[Math.floor(Math.random() * zdown.length)];
    return r;
  }).join('');
}

const sections = [
  {
    id: 'case', name: 'Case',
    items: [
      { id: 'upper',    label: 'Uppercase',     fn: (s: string) => s.toUpperCase() },
      { id: 'lower',    label: 'Lowercase',     fn: (s: string) => s.toLowerCase() },
      { id: 'title',    label: 'Title case',    fn: (s: string) => s.replace(/\w\S*/g, w => w[0]?.toUpperCase() + w.slice(1).toLowerCase()) },
      { id: 'sentence', label: 'Sentence case', fn: (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() },
      { id: 'camel',    label: 'Camel case',    fn: (s: string) => s.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase()) },
      { id: 'pascal',   label: 'Pascal case',   fn: (s: string) => s.replace(/(?:^|\s|[^a-zA-Z0-9])(\w)/g, (_, c) => c.toUpperCase()).replace(/\s+/g, '') },
      { id: 'snake',    label: 'Snake case',    fn: (s: string) => s.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') },
      { id: 'kebab',    label: 'Kebab case',    fn: (s: string) => s.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') },
      { id: 'dot',      label: 'Dot case',      fn: (s: string) => s.trim().toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '') },
      { id: 'initials', label: 'Initials',      fn: (s: string) => s.split(/\s+/).map(w => w[0]?.toUpperCase()).join('.') + '.' },
      { id: 'nospace',  label: 'No spaces',     fn: (s: string) => s.replace(/\s/g, '') },
      { id: 'novowels', label: 'No vowels',     fn: (s: string) => s.replace(/[aeiouAEIOU]/g, '') },
    ],
  },
  {
    id: 'fun', name: 'Fun',
    items: [
      { id: 'mock',  label: 'Mocking',     fn: (s: string) => s.split('').map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join('') },
      { id: 'clap',  label: 'Clapback',    fn: (s: string) => s.split('').map(c => c === ' ' ? ' 👏 ' : c).join('').toUpperCase() },
      { id: 'flip',  label: 'Upside down', fn: (s: string) => s.split('').map(c => flip[c] || c).reverse().join('') },
      { id: 'l33t',  label: 'Leet speak',  fn: (s: string) => s.replace(/[aeiostzb012345678]/gi, c => l33t[c] || c) },
      { id: 'zalgo', label: 'Zalgo',       fn: zalgo, isZalgo: true },
      { id: 'morse', label: 'Morse',       fn: (s: string) => s.toLowerCase().split('').map(c => morse[c] || c).join(' ') },
    ],
  },
];

const open = ref<Record<string, boolean>>(Object.fromEntries(sections.map(s => [s.id, true])));

const results = computed(() =>
  sections.map(s => ({
    ...s,
    items: s.items.map(t => ({ ...t, value: text.value ? t.fn(text.value) : '' })),
  }))
);

function copy(id: string, val: string) {
  if (!val) return;
  navigator.clipboard.writeText(val);
  copied.value = id;
  setTimeout(() => { if (copied.value === id) copied.value = null; }, 1500);
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="space-y-6 flex flex-col mb-5">
      <h1 class="text-2xl md:text-3xl font-bold text-white mb-2">Text Transformer</h1>
      <p class="text-base-400">Paste any text and convert to other formats.</p>
      <UInput
        v-model="text"
        :placeholder="text"
        icon="i-heroicons-language"
        size="xl"
        variant="subtle"
        class="flex-1"
      />
    </div>

    <UCollapsible
      v-for="section in results"
      :key="section.id"
      v-model:open="open[section.id]"
      class="flex flex-col gap-3"
    >
      <UButton
        color="neutral"
        variant="outline"
        block
        :trailing-icon="open[section.id] ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
        class="justify-between"
      >
        <span class="text-sm font-semibold text-highlighted">{{ section.name }}</span>
      </UButton>

      <template #content>
        <UPageGrid class="mt-1 gap-5 px-2 pb-2">
          <UCard
            v-for="item in section.items"
            :key="item.id"
            variant="subtle"
            :ui="{ body: item.isZalgo ? 'sm:p-4 p-4 pt-10 pb-16' : 'sm:p-4 p-4' }"
            class="relative transition-all duration-150 cursor-copy"
            :class="[
              copied === item.id ? 'ring-2 ring-primary-500' : 'ring-1 ring-transparent hover:ring-primary-500',
              item.isZalgo ? '!overflow-visible' : '',
            ]"
            @click="copy(item.id, item.value)"
            @mouseenter="hovered = item.id"
            @mouseleave="hovered = null"
          >
            <UIcon
              :name="copied === item.id ? 'i-lucide-check' : 'i-lucide-copy'"
              class="absolute top-2 right-2 size-3.5 shrink-0 transition-all duration-150"
              :class="copied === item.id || hovered === item.id ? 'text-primary-500 opacity-100' : 'opacity-0'"
            />
            <p class="text-sm font-medium text-muted uppercase tracking-wider">{{ item.label }}</p>
            <p class="font-mono text-default break-all leading-relaxed mt-1" :class="item.isZalgo ? 'py-10' : ''">
              {{ item.value || '—' }}
            </p>
          </UCard>
        </UPageGrid>
      </template>
    </UCollapsible>
  </div>
</template>