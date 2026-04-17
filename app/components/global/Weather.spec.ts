import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import Weather from './Weather.vue';

const mockResponse = {
  weather: {
    current: {
      temperature_2m: 15,
      apparent_temperature: 13,
      relative_humidity_2m: 72,
      wind_speed_10m: 18,
      wind_direction_10m: 270,
      surface_pressure: 1013,
      visibility: 10000,
      weather_code: 1,
    },
    daily: {
      time: ['2026-04-16', '2026-04-17', '2026-04-18'],
      temperature_2m_max: [17, 19, 14],
      temperature_2m_min: [10, 11, 9],
      weather_code: [1, 3, 61],
    },
  },
};

const mockFetch = vi.fn();
vi.stubGlobal('$fetch', mockFetch);
vi.stubGlobal('import', { meta: { client: false } });

const geolocationMock = { getCurrentPosition: vi.fn() };
Object.defineProperty(global.navigator, 'geolocation', {
  value: geolocationMock,
  writable: true,
});

const nuxtEls = {
  UButton: {
    template:
      '<button v-bind="$attrs" @click="$emit(\'click\')"><slot/>{{ $attrs.label }}</button>',
    emits: ['click'],
  },
  UInputMenu: { template: '<div/>' },
  UFieldGroup: { template: '<div><slot/></div>' },
  UCard: { template: '<div><slot/></div>' },
  UAlert: { template: '<div role="alert" v-bind="$attrs"><slot/></div>' },
  UIcon: { template: '<span/>' },
  ULink: { template: '<a v-bind="$attrs"><slot/></a>' },
};

function mountWeather() {
  return mount(Weather, { global: { stubs: nuxtEls } });
}

describe('Weather component', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    geolocationMock.getCurrentPosition.mockReset();
    mockFetch.mockResolvedValue(mockResponse);
  });

  afterEach(() => vi.restoreAllMocks());

  it('fetches London weather', async () => {
    mountWeather();
    await flushPromises();
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/weather',
      expect.objectContaining({
        params: { lat: 51.5074, lon: -0.1278 },
      }),
    );
  });

  it('renders current temperature and condition', async () => {
    const wrapper = mountWeather();
    await flushPromises();
    expect(wrapper.text()).toContain('15');
    expect(wrapper.text()).toContain('Partly cloudy');
  });

  it('renders all four stats', async () => {
    const wrapper = mountWeather();
    await flushPromises();
    expect(wrapper.text()).toContain('72%');
    expect(wrapper.text()).toContain('18 km/h');
    expect(wrapper.text()).toContain('1013 hPa');
    expect(wrapper.text()).toContain('10.0 km');
  });

  it('converts °C to °F', async () => {
    const wrapper = mountWeather();
    await flushPromises();

    const fBtn = wrapper.findAll('button').find((b) => b.text().includes('°F'));
    await fBtn!.trigger('click');

    expect(wrapper.text()).toContain('59');
    expect(wrapper.text()).toContain('55');
    expect(wrapper.text()).toContain('°F');
  });

  it('shows forecast when Forecast tab is clicked', async () => {
    const wrapper = mountWeather();
    await flushPromises();

    const tab = wrapper.findAll('button').find((b) => b.text() === 'Forecast');
    await tab!.trigger('click');

    expect(wrapper.text()).toContain('17');
    expect(wrapper.text()).toContain('10');
    expect(wrapper.text()).toMatch(/\w{3}\s\d+/);
  });

  it('calls GPS when button is clicked', async () => {
    const wrapper = mountWeather();
    await flushPromises();

    const gpsBtn = wrapper.find('button[title="Use current location"]');
    await gpsBtn.trigger('click');

    expect(geolocationMock.getCurrentPosition).toHaveBeenCalled();
  });

  it('fetches GPS weather', async () => {
    geolocationMock.getCurrentPosition.mockImplementation((ok: any) =>
      ok({ coords: { latitude: 48.85, longitude: 2.35 } }),
    );

    const wrapper = mountWeather();
    await flushPromises();
    mockFetch.mockClear();

    wrapper.find('button[title="Use current location"]').trigger('click');
    await flushPromises();

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/weather',
      expect.objectContaining({
        params: { lat: 48.85, lon: 2.35 },
      }),
    );
  });
});
