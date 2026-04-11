import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UrlInspector from './UrlInspector.vue';

vi.stubGlobal('$fetch', vi.fn());
vi.stubGlobal('navigator', {
  clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
});

const $fetch = globalThis.$fetch;

const exampleResult = {
  title: 'Example Title',
  description: 'Example description.',
  url: 'https://example.com',
  image: 'https://example.com/og.jpg',
  favicon: 'https://example.com/favicon.ico',
  openGraph: { 'og:title': 'Example Domain', 'og:type': 'website' },
  twitter: {},
  meta: {},
  links: { icons: [], alternates: [], feeds: [] },
  jsonLd: [],
  html: { lang: 'en' },
  derived: { siteName: 'Example' },
};

describe('UrlInspector', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows the OG title and description after inspecting a URL', async () => {
    $fetch.mockResolvedValueOnce(exampleResult);
    const wrapper = mount(UrlInspector);

    await wrapper.find('input').setValue('example.com');
    await wrapper.find('button').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('Example Title');
    expect(wrapper.text()).toContain('Example description.');
  });

  it('adds https:// if not present', async () => {
    $fetch.mockResolvedValueOnce(exampleResult);
    const wrapper = mount(UrlInspector);

    await wrapper.find('input').setValue('example.com');
    await wrapper.find('button').trigger('click');
    await flushPromises();

    const calledUrl = $fetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('https%3A%2F%2Fexample.com');
  });

  it('does not add https:// if already present', async () => {
    $fetch.mockResolvedValueOnce(exampleResult);
    const wrapper = mount(UrlInspector);

    await wrapper.find('input').setValue('https://example.com');
    await wrapper.find('button').trigger('click');
    await flushPromises();

    const calledUrl = $fetch.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain('https%3A%2F%2Fhttps');
  });

  it('shows an error message on failed request', async () => {
    $fetch.mockRejectedValueOnce({
      data: { message: 'This URL could not be reached.' },
    });
    const wrapper = mount(UrlInspector);

    await wrapper.find('input').setValue('https://broken.example.com');
    await wrapper.find('button').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('This URL could not be reached.');
  });

  it('refresh=true', async () => {
    $fetch.mockResolvedValue(exampleResult);
    const wrapper = mount(UrlInspector);

    // first inspect to get a result
    await wrapper.find('input').setValue('https://example.com');
    await wrapper.find('button').trigger('click');
    await flushPromises();

    // now click "Refresh meta" (second button)
    await wrapper.findAll('button')[1].trigger('click');
    await flushPromises();

    const refreshUrl = $fetch.mock.calls[1][0] as string;
    expect(refreshUrl).toContain('refresh=true');
  });
});
