import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import MarkdownEditor from './MarkdownEditor.vue';

const writeTextMock = vi.fn().mockResolvedValue(undefined);
const writeMock = vi.fn().mockResolvedValue(undefined);

Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: writeTextMock,
    write: writeMock,
  },
  writable: true,
  configurable: true,
});

if (!globalThis.ClipboardItem) {
  globalThis.ClipboardItem = class ClipboardItem {
    constructor(data: any) {
      Object.assign(this, data);
    }
  } as any;
}

describe('MarkdownEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

const globalStubs = {
    ClientOnly: { template: '<div><slot /></div>' },
    UCard: { template: '<div><slot name="header" /><slot /></div>' },
    UTooltip: { template: '<div><slot /></div>' },
    UButton: { template: '<button v-bind="$attrs"><slot /></button>' },
  };

  it('copies raw markdown', async () => {
    const wrapper = mount(MarkdownEditor, {
      global: { stubs: globalStubs },
    });

    await wrapper.vm.$nextTick();

    const copyMdButton = wrapper.find('button[aria-label="Copy as Markdown"]');
    expect(copyMdButton.exists()).toBe(true);

    await copyMdButton.trigger('click');

    expect(writeTextMock).toHaveBeenCalledOnce();
    const clipboardContent = writeTextMock.mock.calls[0][0];
    
    expect(clipboardContent).toContain('# Hello World!');
  });

it('copies rich text', async () => {
    const wrapper = mount(MarkdownEditor, {
      global: { stubs: globalStubs },
    });

    await wrapper.vm.$nextTick();

    const copyRtfButton = wrapper.find('button[aria-label="Copy as Rich Text"]');
    expect(copyRtfButton.exists()).toBe(true);

    await copyRtfButton.trigger('click');

    expect(writeMock).toHaveBeenCalledOnce();
    
    const payload = writeMock.mock.calls[0][0];
    expect(Array.isArray(payload)).toBe(true);
    expect(payload[0]).toBeInstanceOf(globalThis.ClipboardItem);
    
    const clipboardTypes = payload[0].types;
    expect(clipboardTypes).toContain('text/html');
    expect(clipboardTypes).toContain('text/plain');
  });
});