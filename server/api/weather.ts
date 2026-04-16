export default defineEventHandler(
  async (
    event,
  ): Promise<{
    weather: any;
    location: string;
  }> => {
    const { lat, lon } = getQuery(event) as { lat: string; lon: string };

    const [weather, geo] = await Promise.all([
      $fetch<any>('https://api.open-meteo.com/v1/forecast', {
        params: {
          latitude: lat,
          longitude: lon,
          current: [
            'temperature_2m',
            'apparent_temperature',
            'relative_humidity_2m',
            'wind_speed_10m',
            'wind_direction_10m',
            'weather_code',
            'surface_pressure',
            'visibility',
            'precipitation',
          ].join(','),
          daily: [
            'weather_code',
            'temperature_2m_max',
            'temperature_2m_min',
          ].join(','),
          wind_speed_unit: 'kmh',
          timezone: 'auto',
          forecast_days: 5,
        },
      }),
      $fetch<any>('https://nominatim.openstreetmap.org/reverse', {
        params: { lat, lon, format: 'json' },
        headers: { 'User-Agent': 'jlopes-tools/1.0' },
      }),
    ]);

    const city =
      geo.address?.city ??
      geo.address?.town ??
      geo.address?.village ??
      geo.address?.county ??
      'Unknown';
    const country = geo.address?.country_code?.toUpperCase() ?? '';

    return { weather, location: `${city}, ${country}` };
  },
);
