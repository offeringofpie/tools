import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import UtmBuilder from './UtmBuilder.vue';

Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: vi.fn().mockResolvedValue(undefined) },
  writable: true,
  configurable: true,
});

const globalStubs = {
  UCard: { template: '<div><slot name="header" /><slot /></div>' },
  UFormField: { template: '<div><slot /></div>' },
  UInput: { template: '<input />' },
  USeparator: { template: '<hr />' },
  UTooltip: { template: '<div><slot /></div>' },
  ULink: { template: '<a><slot /></a>' },
  UIcon: { template: '<span></span>' },
  UButton: { template: '<button><slot /></button>' },
};

describe('UtmBuilder.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates a URL from fields', async () => {
    const wrapper = mount(UtmBuilder, { global: { stubs: globalStubs } });

    wrapper.vm.url = 'example.com';
    wrapper.vm.utm.source = 'google';
    wrapper.vm.utm.medium = 'email';
    wrapper.vm.utm.campaign = 'campaign';

    await wrapper.vm.$nextTick();

    expect(wrapper.vm.finalUrl).toBe(
      'https://example.com/?utm_source=google&utm_medium=email&utm_campaign=campaign',
    );
  });

  it('parses, extracts parameters and cleans URL', async () => {
    const wrapper = mount(UtmBuilder, { global: { stubs: globalStubs } });

    wrapper.vm.parseUrl(
      'https://example.com/promo?utm_source=google&utm_medium=email&utm_campaign=campaign&other=123',
    );

    await wrapper.vm.$nextTick();

    expect(wrapper.vm.url).toBe('https://example.com/promo?other=123');

    expect(wrapper.vm.utm.source).toBe('google');
    expect(wrapper.vm.utm.medium).toBe('email');
    expect(wrapper.vm.utm.campaign).toBe('campaign');
  });

  it('safely handles invalid URLs during typing', async () => {
    const wrapper = mount(UtmBuilder, { global: { stubs: globalStubs } });

    wrapper.vm.parseUrl('http://incomplet');

    await wrapper.vm.$nextTick();

    expect(wrapper.vm.url).toBe('http://incomplet');
  });

  it('clears all fields', async () => {
    const wrapper = mount(UtmBuilder, { global: { stubs: globalStubs } });

    wrapper.vm.url = 'example.com';
    wrapper.vm.utm.source = 'test';
    await wrapper.vm.$nextTick();

    wrapper.vm.reset();
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.url).toBe('');
    expect(wrapper.vm.utm.source).toBe('');
  });
});
