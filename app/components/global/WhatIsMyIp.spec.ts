import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import WhatIsMyIp from './WhatIsMyIp.vue';

const mockIpData = {
  ip: '123.45.67.89',
  city: 'London',
  region: 'England',
  country_name: 'United Kingdom',
  country_code: 'GB',
  org: 'BT Group PLC',
  timezone: 'Europe/London',
  latitude: 51.5074,
  longitude: -0.1278,
};

describe('WhatIsMyIp', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('on mount', () => {
    it('calls the ipapi.co endpoint on mount', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockIpData,
      } as Response);

      mount(WhatIsMyIp);

      expect(fetch).toHaveBeenCalledWith('https://ipapi.co/json/');
    });

    it('renders IP address after successful fetch', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockIpData,
      } as Response);

      const wrapper = mount(WhatIsMyIp);
      await flushPromises();

      expect(wrapper.text()).toContain('123.45.67.89');
    });

    it('renders all six detail cards with correct values', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockIpData,
      } as Response);

      const wrapper = mount(WhatIsMyIp);
      await flushPromises();

      expect(wrapper.text()).toContain('BT Group PLC');
      expect(wrapper.text()).toContain('London');
      expect(wrapper.text()).toContain('England');
      expect(wrapper.text()).toContain('United Kingdom (GB)');
      expect(wrapper.text()).toContain('Europe/London');
      expect(wrapper.text()).toContain('51.5074');
      expect(wrapper.text()).toContain('-0.1278');
    });

    it('displays an error alert when the fetch fails with a non-OK response', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 503,
      } as Response);

      const wrapper = mount(WhatIsMyIp);
      await flushPromises();

      expect(wrapper.text()).toContain('HTTP 503');
    });

    it('displays an error alert when fetch throws a network error', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network failure'));

      const wrapper = mount(WhatIsMyIp);
      await flushPromises();

      expect(wrapper.text()).toContain('Network failure');
    });

    it('fetches when the refresh button is clicked', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockIpData,
      } as Response);

      const wrapper = mount(WhatIsMyIp);
      await flushPromises();

      expect(fetch).toHaveBeenCalledTimes(1);

      await wrapper.find('button').trigger('click');
      await flushPromises();

      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });
});
