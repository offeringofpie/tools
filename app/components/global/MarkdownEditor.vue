<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import { marked } from 'marked';

const blocks = /^(#{1,6}\s|\*|-|\+|>|\d+\.\s|```)/m;
const inline = /(\*\*|__|`|~~).+?\1/;

const copied = ref<'none' | 'md' | 'rich'>('none');

const editor = useEditor({
  extensions: [StarterKit, Markdown],
  content: `# Hello World!

This is a simple markdown editor

* Just type naturally.
* Use the toolbar above.
* Paste some raw Markdown.
`,
  editorProps: {
    attributes: {
      class: 'prose prose-invert max-w-none prose-p:my-1 focus:outline-none min-h-[500px] py-4 px-2 md:px-8',
      'aria-label': 'Markdown editor content',
    },
    handlePaste(_view, event) {
      const text = event.clipboardData?.getData('text/plain');
      if (!text) return false;

      if (blocks.test(text) || inline.test(text)) {
        event.preventDefault();
        editor.value?.commands.insertContent(marked.parse(text));
        return true;
      }
      return false;
    },
  },
});

const menu = [
  [
    { label: 'Bold', name: 'bold', icon: 'B', class: 'font-bold font-sans', cmd: 'toggleBold' },
    { label: 'Italic', name: 'italic', icon: 'I', class: 'italic font-serif', cmd: 'toggleItalic' },
    { label: 'Strikethrough', name: 'strike', icon: 'S', class: 'line-through', cmd: 'toggleStrike' },
  ],
  [
    { label: 'Heading 1', name: 'heading', attrs: { level: 1 }, icon: 'H1', class: 'font-bold text-xs', cmd: 'toggleHeading' },
    { label: 'Heading 2', name: 'heading', attrs: { level: 2 }, icon: 'H2', class: 'font-bold text-xs', cmd: 'toggleHeading' },
    { label: 'Heading 3', name: 'heading', attrs: { level: 3 }, icon: 'H3', class: 'font-bold text-xs', cmd: 'toggleHeading' },
  ],
  [
    { label: 'Bullet List', name: 'bulletList', icon: 'i-heroicons-list-bullet', cmd: 'toggleBulletList' },
    { label: 'Numbered List', name: 'orderedList', icon: 'i-heroicons-numbered-list', cmd: 'toggleOrderedList' },
    { label: 'Blockquote', name: 'blockquote', icon: 'i-heroicons-chat-bubble-oval-left-ellipsis', cmd: 'toggleBlockquote' },
    { label: 'Code Block', name: 'codeBlock', icon: 'i-heroicons-code-bracket-square', cmd: 'toggleCodeBlock' },
    { label: 'Horizontal Rule', name: 'horizontalRule', icon: 'i-heroicons-minus', cmd: 'setHorizontalRule' },
  ],
  [
    { label: 'Undo', icon: 'i-heroicons-arrow-uturn-left', cmd: 'undo' },
    { label: 'Redo', icon: 'i-heroicons-arrow-uturn-right', cmd: 'redo' },
  ],
];

function run(cmd: string, attrs?: any) {
  const chain = editor.value?.chain().focus() as any;
  chain?.[cmd]?.(attrs).run();
}

function isDisabled(cmd: string) {
  if (cmd === 'undo') return !editor.value?.can().undo();
  if (cmd === 'redo') return !editor.value?.can().redo();
  return false;
}

function flashSuccess(type: 'md' | 'rich') {
  copied.value = type;
  setTimeout(() => (copied.value = 'none'), 2000);
}

async function copy(type: 'md' | 'rich') {
  if (!editor.value) return;

  try {
    if (type === 'md') {
      await navigator.clipboard.writeText(editor.value.storage.markdown.getMarkdown());
    } else {
      const item = new ClipboardItem({
        'text/html': new Blob([editor.value.getHTML()], { type: 'text/html' }),
        'text/plain': new Blob([editor.value.getText()], { type: 'text/plain' }),
      });
      await navigator.clipboard.write([item]);
    }
    flashSuccess(type);
  } catch (err) {
    console.error(`Copy failed:`, err);
  }
}

onBeforeUnmount(() => editor.value?.destroy());
</script>

<template>
  <div class="space-y-6 max-w-4xl mx-auto">
    <span aria-live="polite" class="sr-only">
      {{ copied !== 'none' ? `Copied as ${copied === 'md' ? 'Markdown' : 'Rich Text'}` : '' }}
    </span>

    <div class="space-y-2">
      <h1 id="editor-title" class="text-2xl md:text-3xl font-bold text-white">
        Markdown Editor
      </h1>
      <p class="text-base-400">
        A clean, distraction-free writing environment.
      </p>
    </div>

    <UCard class="flex flex-col border border-base-800 flex-1 p-0 sm:p-0">
      <template #header>
        <div class="flex flex-col gap-4 md:flex-row md:items-center justify-between">
          
          <div
            v-if="editor"
            role="toolbar"
            aria-label="Formatting tools"
            class="flex flex-wrap items-center gap-1 bg-base-900 p-1 rounded-lg border border-base-800"
          >
            <template v-for="(section, i) in menu" :key="i">
              
              <div
                role="group"
                :aria-label="`Formatting group ${i + 1}`"
                class="flex items-center gap-1"
              >
                <UTooltip v-for="(tool, j) in section" :key="j" :text="tool.label">
                  <UButton
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    :aria-label="tool.label"
                    :aria-pressed="tool.name ? editor.isActive(tool.name, tool.attrs) : undefined"
                    :disabled="isDisabled(tool.cmd)"
                    :icon="tool.icon.startsWith('i-') ? tool.icon : undefined"
                    :class="{ 'bg-base-800 text-white': tool.name && editor.isActive(tool.name, tool.attrs) }"
                    @click="run(tool.cmd, tool.attrs)"
                  >
                    <span
                      v-if="!tool.icon.startsWith('i-')"
                      class="w-4 text-center"
                      aria-hidden="true"
                    >
                      {{ tool.icon }}
                    </span>
                  </UButton>
                </UTooltip>
              </div>

              <div
                v-if="i < menu.length - 1"
                class="w-px h-5 bg-base-800 mx-1"
                aria-hidden="true"
              ></div>
            </template>
          </div>

          <div class="flex items-center gap-2">
            <UButton
              :icon="copied === 'md' ? 'i-heroicons-check' : 'i-heroicons-document-arrow-down'"
              :color="copied === 'md' ? 'success' : 'neutral'"
              variant="subtle"
              size="sm"
              aria-label="Copy as Markdown"
              @click="copy('md')"
            >
              Markdown
            </UButton>
            <UButton
              :icon="copied === 'rich' ? 'i-heroicons-check' : 'i-heroicons-document-duplicate'"
              :color="copied === 'rich' ? 'success' : 'neutral'"
              variant="soft"
              size="sm"
              aria-label="Copy as Rich Text"
              @click="copy('rich')"
            >
              Rich Text
            </UButton>
          </div>
        </div>
      </template>

      <ClientOnly>
        <div
          class="bg-base-950/50 cursor-text rounded-b-xl"
          @click="editor?.commands.focus()"
        >
          <editor-content :editor="editor" />
        </div>
        <template #fallback>
          <div class="min-h-125 flex items-center justify-center text-base-500">
            Loading editor...
          </div>
        </template>
      </ClientOnly>
    </UCard>
  </div>
</template>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>