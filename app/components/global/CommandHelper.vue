<script lang="ts">
import curlData from '~/data/commands/curl.json';
import ffmpegData from '~/data/commands/ffmpeg.json';
import gitData from '~/data/commands/git.json';
import sedData from '~/data/commands/sed.json';
import tarData from '~/data/commands/tar.json';
import type {
  CommandApp,
  Context,
  Field,
  ReadoutRow,
  ReadoutStep,
  Reader,
  Task,
  Values,
  Word,
} from '~/data/commands/types';

const bareValue = /^[A-Za-z0-9_@+,./:-][A-Za-z0-9_@+=,./:-]*$/;
const homePrefix = '~/';
const placeholder = /\{(\w+)(?:\.(\w+))?(?:\|(\w+))?\}/g;
const shortFlag = /^-[A-Za-z]$/;
const flagWord = /^--?[A-Za-z]/;
const outsideQuotes = /\\{2,}|\\(?=')|\\$|'/g;
const emptyQuotes = /^''|''$/g;
const unescapedSlash = /(\\.)|\//g;
const slashFilter = 'slash';
const quote = "'";
const groupStart = '[';
const groupEnd = ']';
const openers = [groupStart, '{'];
const closers = [groupEnd, '}'];
const choiceSeparator = '|';
const commentPrefix = '# ';
const chain = '&&';

const escapeSlashes = (value: string): string => {
  return value.replace(unescapedSlash, (_match, escaped?: string) => {
    return escaped ?? '\\/';
  });
};

const quoteLiteral = (value: string): string => {
  const spliced = value.replace(outsideQuotes, (run) => {
    return `'${[...run].map((char) => `\\${char}`).join('')}'`;
  });

  return `'${spliced}'`.replace(emptyQuotes, '');
};

const shellQuote = (value: string): string => {
  if (value === '') {
    return "''";
  }

  if (bareValue.test(value)) {
    return value;
  }

  if (value.startsWith(homePrefix)) {
    return `${homePrefix}${quoteLiteral(value.slice(homePrefix.length))}`;
  }

  return quoteLiteral(value);
};

const fallbackFor = (field: Field | undefined): string => {
  if (!field || field.kind === 'select' || field.kind === 'tags') {
    return '';
  }

  if (field.kind === 'time') {
    return field.initial;
  }

  return field.optional ? '' : field.placeholder;
};

const makeReader = (task: Task, values: Values): Reader => {
  return {
    text: (id) => {
      const field = task.fields[id];
      const stored = values.fields[id];
      const typed = typeof stored === 'string' ? stored : '';
      const keepSpaces =
        field !== undefined && 'spaces' in field && field.spaces === 'keep';

      return (keepSpaces ? typed : typed.trim()) || fallbackFor(field);
    },
    list: (id) => {
      const stored = values.fields[id];
      return Array.isArray(stored) ? stored : [];
    },
    on: (id) => values.flags.includes(id),
  };
};

const splitOutside = (text: string, separator: string): string[] => {
  const pieces: string[] = [];
  let current = '';
  let quoted = false;
  let depth = 0;

  for (const char of text) {
    if (char === quote) {
      quoted = !quoted;
    }

    if (!quoted && openers.includes(char)) {
      depth += 1;
    }

    if (!quoted && closers.includes(char)) {
      depth -= 1;
    }

    if (!quoted && depth === 0 && char === separator) {
      pieces.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  pieces.push(current);

  return pieces.map((piece) => piece.trim()).filter(Boolean);
};

const placeholdersIn = (text: string) => {
  return [...text.matchAll(placeholder)].map(([, id = '', key]) => {
    return { id, key };
  });
};

const isTyped = (task: Task, id: string): boolean => {
  const field = task.fields[id];

  return field !== undefined && field.kind !== 'select';
};

const valueOf = (
  context: Context,
  id: string,
  key: string | undefined,
): string => {
  const { task, read, item } = context;
  const flag = task.flags?.[id];

  if (flag) {
    return read.on(id) ? flag.value : '';
  }

  const field = task.fields[id];

  if (field?.kind === 'select') {
    const option = field.options.find((entry) => {
      return entry.label === read.text(id);
    });

    return option?.[key ?? 'value'] ?? '';
  }

  if (field?.kind === 'tags') {
    return item;
  }

  return read.text(id);
};

const toWords = (template: string, context: Context): Word[] => {
  const quoted = template.startsWith(quote) && template.endsWith(quote);
  const body = quoted ? template.slice(1, -1) : template;
  const typed = placeholdersIn(body).some(({ id }) => {
    return isTyped(context.task, id);
  });

  const filled = body.replace(
    placeholder,
    (_match, id: string, key?: string, filter?: string) => {
      const value = valueOf(context, id, key);

      return filter === slashFilter ? escapeSlashes(value) : value;
    },
  );

  if (quoted) {
    return [{ kind: 'value', text: quoteLiteral(filled) }];
  }

  if (typed) {
    return [{ kind: 'value', text: shellQuote(filled) }];
  }

  return filled
    .split(' ')
    .filter(Boolean)
    .map((text): Word => {
      return { kind: flagWord.test(text) ? 'flag' : 'value', text };
    });
};

const groupWords = (group: string, context: Context): Word[] => {
  for (const choice of splitOutside(group, choiceSeparator)) {
    const used = placeholdersIn(choice);
    const tags = used.find(({ id }) => {
      return context.task.fields[id]?.kind === 'tags';
    });
    const items = tags ? context.read.list(tags.id) : [''];
    const complete = used.every(({ id, key }) => {
      return id === tags?.id || valueOf(context, id, key) !== '';
    });

    if (items.length && complete) {
      return items.flatMap((item) => lineWords(choice, { ...context, item }));
    }
  }

  return [];
};

const lineWords = (line: string, context: Context): Word[] => {
  return splitOutside(line, ' ').flatMap((piece) => {
    if (piece.startsWith(groupStart) && piece.endsWith(groupEnd)) {
      return groupWords(piece.slice(1, -1), context);
    }

    return toWords(piece, context);
  });
};

const initialValues = (task: Task): Values => {
  const fields: Values['fields'] = {};

  for (const [id, field] of Object.entries(task.fields)) {
    switch (field.kind) {
      case undefined:
      case 'text':
      case 'textarea': {
        fields[id] = '';
        break;
      }
      case 'select': {
        fields[id] = field.initial ?? field.options[0]!.label;
        break;
      }
      case 'time': {
        fields[id] = field.initial;
        break;
      }
      case 'tags': {
        fields[id] = [];
        break;
      }
      default: {
        const _exhaustive: never = field;
        throw new Error(`Unhandled field: ${_exhaustive}`);
      }
    }
  }

  const flags = Object.entries(task.flags ?? {})
    .filter(([, flag]) => flag.on)
    .map(([id]) => id);

  return { fields, flags };
};

const mergeClusters = (words: Word[]): Word[] => {
  const merged: Word[] = [];
  let cluster: Word | undefined;

  for (const word of words) {
    const isShort = word.kind === 'flag' && shortFlag.test(word.text);

    if (cluster && isShort) {
      cluster.text += word.text.slice(1);
      continue;
    }

    cluster = isShort ? { ...word } : undefined;
    merged.push(cluster ?? word);
  }

  return merged;
};

const pairRows = (words: Word[]): ReadoutRow[] => {
  const rows: ReadoutRow[] = [];

  for (const word of words) {
    const previous = rows.at(-1);

    if (word.kind === 'value' && previous?.kind === 'flag') {
      previous.kind = 'option';
      previous.value = word.text;
      continue;
    }

    if (word.kind === 'flag') {
      rows.push({ kind: 'flag', flag: word.text, value: '' });
      continue;
    }

    rows.push({ kind: 'argument', flag: '', value: word.text });
  }

  return rows;
};

const buildReadout = (
  app: CommandApp,
  task: Task,
  values: Values,
): ReadoutStep[] => {
  const context: Context = { task, read: makeReader(task, values), item: '' };
  const steps: ReadoutStep[] = [];
  let comment = '';

  for (const line of task.script) {
    if (line.startsWith(commentPrefix)) {
      comment = line.slice(commentPrefix.length);
      continue;
    }

    const [program, ...words] = lineWords(line, context);
    const rows = pairRows(app.cluster ? mergeClusters(words) : words);

    steps.push({
      comment,
      rows: [{ kind: 'program', flag: '', value: program!.text }, ...rows],
    });
    comment = '';
  }

  return steps;
};

const lineText = (rows: ReadoutRow[]): string => {
  return rows
    .map((row) => [row.flag, row.value].filter(Boolean).join(' '))
    .join(' ');
};

const commandText = (steps: ReadoutStep[]): string => {
  return steps.map((step) => lineText(step.rows)).join(` ${chain}\n`);
};

const commandApps = [
  curlData,
  ffmpegData,
  gitData,
  sedData,
  tarData,
] as CommandApp[];
</script>

<script setup lang="ts">
import { useClipboard } from '@vueuse/core';
import { parseTime } from '@internationalized/date';
import {
  UInput,
  UInputTags,
  UInputTime,
  USelect,
  UTextarea,
} from '#components';
import type { Time } from '@internationalized/date';
import type { Component } from 'vue';
import type { PageLink, TabsItem, ThemeDefaults, ThemeUI } from '#ui/types';

const externalTarget = '_blank';
const textareaRows = 3;
const textareaMaxRows = 10;
const space = ' ';
const columnClasses: Record<number, string> = {
  1: '',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
};
const headingClass =
  'text-sm font-semibold uppercase tracking-wider text-highlighted';
const terminalAttrs = {
  autocomplete: 'off',
  autocapitalize: 'off',
  spellcheck: false,
};

const themeProps: ThemeDefaults = {
  input: { size: 'xl', variant: 'subtle' },
  textarea: { size: 'xl', variant: 'subtle' },
  select: { size: 'xl', variant: 'subtle' },
  inputTags: { size: 'xl', variant: 'subtle' },
  inputTime: { size: 'xl', variant: 'subtle' },
};

const themeUi: ThemeUI = {
  input: { root: 'w-full', base: 'font-mono' },
  textarea: { root: 'w-full', base: 'font-mono' },
  select: { base: 'w-full' },
  inputTags: { root: 'w-full font-mono' },
  inputTime: { base: 'w-full font-mono' },
  checkboxGroup: { legend: `mb-3 ${headingClass}`, fieldset: 'gap-y-3' },
  pageLinks: { title: headingClass, link: 'min-h-11 sm:min-h-0' },
};

const controls: Record<NonNullable<Field['kind']>, Component> = {
  text: UInput,
  textarea: UTextarea,
  select: USelect,
  tags: UInputTags,
  time: UInputTime,
};

type TaskItem =
  | { type: 'item'; label: string; value: string }
  | { type: 'label'; label: string };

const tricksLabel: TaskItem = { type: 'label', label: 'Tricks' };

const valueColour: Record<ReadoutRow['kind'], string> = {
  program: 'text-primary',
  flag: 'text-highlighted',
  option: 'text-highlighted',
  argument: 'text-highlighted',
};

const appName = ref(commandApps[0]!.name);
const app = computed(() => {
  return commandApps.find((item) => item.name === appName.value)!;
});

const taskTitle = ref(app.value.tasks[0]!.title);
const task = computed(() => {
  const tasks = [...app.value.tasks, ...(app.value.tricks ?? [])];
  return tasks.find((item) => item.title === taskTitle.value)!;
});

const values = ref<Values>(initialValues(task.value));
const readout = computed(() => {
  return buildReadout(app.value, task.value, values.value);
});
const command = computed(() => commandText(readout.value));

const { copy, copied } = useClipboard({ source: command, legacy: true });

const appTabs: TabsItem[] = commandApps.map((item) => {
  return { label: item.name, value: item.name };
});

const taskItems = computed(() => {
  const toItem = (item: Task): TaskItem => {
    return { type: 'item', label: item.title, value: item.title };
  };

  const commands = app.value.tasks.map(toItem);

  if (!app.value.tricks) {
    return [commands];
  }

  return [commands, [tricksLabel, ...app.value.tricks.map(toItem)]];
});

const flagItems = computed(() => {
  return Object.entries(task.value.flags ?? {}).map(([id, flag]) => {
    return { label: flag.label, value: id };
  });
});

const modelProps = (id: string) => {
  return {
    modelValue: values.value.fields[id],
    'onUpdate:modelValue': (value: string | string[]) => {
      values.value.fields[id] = value;
    },
  };
};

const controlProps = (id: string, field: Field) => {
  switch (field.kind) {
    case undefined:
    case 'text': {
      return {
        ...modelProps(id),
        placeholder: field.placeholder,
        ...terminalAttrs,
      };
    }
    case 'textarea': {
      return {
        ...modelProps(id),
        placeholder: field.placeholder,
        autoresize: true,
        rows: textareaRows,
        maxrows: textareaMaxRows,
        ...terminalAttrs,
      };
    }
    case 'select': {
      return {
        ...modelProps(id),
        items: field.options.map((option) => option.label),
      };
    }
    case 'tags': {
      return {
        ...modelProps(id),
        placeholder: field.placeholder,
        addOnBlur: true,
        addOnPaste: true,
        addOnTab: true,
        ...terminalAttrs,
      };
    }
    case 'time': {
      return {
        'aria-label': field.label,
        defaultValue: parseTime(field.initial),
        granularity: 'second',
        hourCycle: 24,
        'onUpdate:modelValue': (time?: Time | null) => {
          values.value.fields[id] = time ? time.toString() : '';
        },
      };
    }
    default: {
      const _exhaustive: never = field;
      throw new Error(`Unhandled field: ${_exhaustive}`);
    }
  }
};

const fieldViews = computed(() => {
  return Object.entries(task.value.fields).map(([id, field]) => {
    return {
      key: `${task.value.title}:${id}`,
      id,
      label: field.label,
      component: controls[field.kind ?? 'text'],
      props: controlProps(id, field),
    };
  });
});

const fieldRows = computed(() => {
  const views = new Map(fieldViews.value.map((view) => [view.id, view]));
  const layout =
    task.value.layout ?? Object.keys(task.value.fields).map((id) => [id]);

  return layout.map((ids) => {
    const fields = ids.flatMap((id) => views.get(id) ?? []);

    return {
      key: ids.join('|'),
      columnClass: columnClasses[fields.length],
      fields,
    };
  });
});

const steps = computed(() => {
  const lastStep = readout.value.length - 1;

  return readout.value.map((step, stepIndex) => {
    const lastRow = step.rows.length - 1;

    return {
      comment: step.comment,
      rows: step.rows.map((row, index) => {
        const chained = stepIndex < lastStep && index === lastRow;

        return {
          ...row,
          gap: row.flag && row.value ? space : '',
          valueClass: valueColour[row.kind],
          chain: chained ? `${space}${chain}` : '',
        };
      }),
    };
  });
});

const docLinks = computed<PageLink[]>(() => {
  return [
    {
      label: `${app.value.name} documentation`,
      to: app.value.docs,
      target: externalTarget,
    },
  ];
});

const selectTask = (title: string) => {
  taskTitle.value = title;
  values.value = initialValues(task.value);
};

const selectApp = (name: string | number) => {
  appName.value = String(name);
  selectTask(app.value.tasks[0]!.title);
};

const copyCommand = async () => {
  try {
    await copy(command.value);
  } catch (err) {
    console.error('Copy failed', err);
  }
};
</script>

<template>
  <ToolPage>
    <template #actions>
      <UTabs
        :model-value="appName"
        :items="appTabs"
        :content="false"
        aria-label="Command line tool"
        class="w-full md:w-auto"
        @update:model-value="selectApp"
      />
    </template>

    <UTheme :props="themeProps" :ui="themeUi">
      <div
        class="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_420px]"
      >
        <div class="min-w-0 space-y-6">
          <UCard class="border border-default bg-muted/50">
            <template #header>
              <h2 class="sr-only">Options</h2>
              <USelect
                :model-value="taskTitle"
                :items="taskItems"
                aria-label="Task"
                @update:model-value="selectTask"
              />
            </template>

            <div class="space-y-6">
              <div
                v-for="row in fieldRows"
                :key="row.key"
                class="grid grid-cols-1 gap-6"
                :class="row.columnClass"
              >
                <UFormField
                  v-for="field in row.fields"
                  :key="field.key"
                  :label="field.label"
                >
                  <component :is="field.component" v-bind="field.props" />
                </UFormField>
              </div>

              <UCheckboxGroup
                v-if="flagItems.length"
                v-model="values.flags"
                :items="flagItems"
                legend="Flags"
              />
            </div>
          </UCard>
        </div>

        <div class="w-full min-w-0 space-y-6 lg:sticky lg:top-8">
          <UCard class="border border-default bg-muted/50">
            <div class="relative">
              <code
                class="block wrap-break-word rounded-lg border border-default bg-muted p-4 pr-16 font-mono text-sm leading-loose"
              >
                <span
                  v-for="(step, stepIndex) in steps"
                  :key="stepIndex"
                  class="block"
                >
                  <span v-if="step.comment" class="block select-none text-muted"
                    ># {{ step.comment }}</span
                  >
                  <template v-for="(row, index) in step.rows" :key="index"
                    ><span class="inline-block max-w-full"
                      ><span v-if="row.flag" class="text-secondary">{{
                        row.flag
                      }}</span
                      >{{ row.gap
                      }}<span v-if="row.value" :class="row.valueClass">{{
                        row.value
                      }}</span
                      ><span v-if="row.chain" class="text-highlighted">{{
                        row.chain
                      }}</span></span
                    >{{ space }}</template
                  >
                </span>
              </code>

              <UButton
                v-if="copied"
                size="xl"
                color="primary"
                variant="ghost"
                class="pointer-events-none absolute top-2 right-2"
                icon="i-heroicons-check"
                aria-label="Copied!"
              />
              <UButton
                v-else
                size="xl"
                color="neutral"
                variant="ghost"
                class="absolute top-2 right-2 hover:text-primary focus:text-primary"
                icon="i-heroicons-clipboard-document"
                aria-label="Copy command"
                @click="copyCommand"
              />
            </div>
          </UCard>

          <UAlert
            v-if="app.note"
            color="neutral"
            variant="subtle"
            icon="i-heroicons-information-circle"
            :description="app.note"
          />

          <UPageLinks title="Documentation" :links="docLinks" />
        </div>
      </div>
    </UTheme>
  </ToolPage>
</template>
