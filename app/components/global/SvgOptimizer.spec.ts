import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import SvgOptimizer from './SvgOptimizer.vue';

vi.mock('svgo/browser', () => ({
  optimize: vi.fn((raw) => ({ data: `<svg>optimized</svg>` })),
}));

const mockZipFile = vi.fn();
const mockGenerateAsync = vi.fn().mockResolvedValue(new Blob(['zip data']));
vi.mock('jszip', () => ({
  default: vi.fn(() => ({
    file: mockZipFile,
    generateAsync: mockGenerateAsync,
  })),
}));

global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();
global.alert = vi.fn();

Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: vi.fn().mockResolvedValue(undefined) },
  configurable: true,
});
const mockReadAsText = vi.fn(function (this: any, file: File) {
  if (this.onload) {
    this.onload({ target: { result: '<svg>original file content</svg>' } });
  }
});
global.FileReader = vi.fn(() => ({
  readAsText: mockReadAsText,
  onload: null,
})) as any;

describe('SvgOptimizer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createWrapper = () => {
    return mount(SvgOptimizer, {
      global: {
        stubs: {
          UCard: { template: '<div><slot /></div>' },
          UTabs: {
            template: '<div><slot /></div>',
            props: ['modelValue', 'items'],
          },
          UTextarea: {
            template:
              '<textarea :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)"></textarea>',
            props: ['modelValue'],
          },
          UButton: {
            template: '<button @click="$emit(\'click\')"><slot /></button>',
          },
          UIcon: { template: '<span></span>' },
          UBadge: { template: '<span><slot /></span>' },
        },
      },
    });
  };

  it('auto-optimizes valid pasted SVG after a debounce period', async () => {
    const wrapper = createWrapper();

    wrapper.vm.activeTab = 'paste';
    await wrapper.vm.$nextTick();

    const textarea = wrapper.find('textarea');
    await textarea.setValue(
      '<svg xmlns="http://www.w3.org/2000/svg">Raw Text</svg>',
    );

    expect(wrapper.vm.pastedItem).toBeNull();

    vi.advanceTimersByTime(350);
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.pastedItem).not.toBeNull();
    expect(wrapper.vm.pastedItem.optimized).toBe('<svg>optimized</svg>');

    expect(wrapper.text()).toContain('Optimized Output');
  });
});
