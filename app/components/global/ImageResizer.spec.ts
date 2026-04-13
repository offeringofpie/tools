import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ImageResizer from './ImageResizer.vue';

describe('ImageResizer component', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:'),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not show the settings panel when no images are loaded', () => {
    const wrapper = mount(ImageResizer);
    expect(wrapper.text()).not.toContain('Settings');
  });
});
