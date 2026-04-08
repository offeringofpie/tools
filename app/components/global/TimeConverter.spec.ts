import { describe, it, expect } from 'vitest';
import {
  formatDate,
  parseTime,
  getSwatch,
  getJulian,
  getMayan,
  getAltCal,
} from './TimeConverter.vue';

describe('TimeConverter', () => {
  it('formats to UTC with timezone', () => {
    const d = new Date(0);
    expect(formatDate(d, 'UTC')).toBe('Thu, 1 Jan 1970, 00:00:00 UTC');
  });

  it('formatsto a specific target timezone', () => {
    const d = new Date('2026-04-08T12:00:00Z');

    const nyTime = formatDate(d, 'America/New_York');
    expect(nyTime).toMatch(/^Wed, 8 Apr 2026, 08:00:00 (EDT|GMT-4)$/);

    const tokyoTime = formatDate(d, 'Asia/Tokyo');
    expect(tokyoTime).toMatch(/^Wed, 8 Apr 2026, 21:00:00 (JST|GMT\+9)$/);
  });

  it('fallback to system date when no timezone is provided', () => {
    const d = new Date(2026, 3, 8, 9, 20, 37);
    expect(formatDate(d)).toMatch(
      /^[A-Z][a-z]{2}, \d{1,2} [A-Z][a-z]{2} \d{4}, \d{2}:\d{2}:\d{2} [A-Z]+$/,
    );
  });

  it('parses Unix inputs (Seconds & Milliseconds)', () => {
    expect(parseTime('unixSec', '1700000000')).toBe(1700000000000);
    expect(parseTime('unixMs', '1700000000000')).toBe(1700000000000);
  });

  it('etects Unix strings in the main input', () => {
    expect(parseTime('local', '1700000000')).toBe(1700000000000);
    expect(parseTime('local', '1700000000000')).toBe(1700000000000);
  });

  it('parses standard ISO', () => {
    const iso = '2026-04-08T08:20:37.000Z';
    expect(parseTime('local', iso)).toBe(new Date(iso).getTime());
  });

  it('rejects bad inputs', () => {
    expect(parseTime('swatch', '@123')).toBeNaN();
    expect(parseTime('local', 'invalid-string-here')).toBeNaN();
  });

  it('calculates Swatch Internet Time', () => {
    const dStart = new Date('1970-01-01T23:00:00Z');
    expect(getSwatch(dStart)).toBe('@000');

    const dLater = new Date('1970-01-01T00:00:00Z');
    expect(getSwatch(dLater)).toBe('@041');
  });

  it('calculates Julian date', () => {
    const d = new Date(0);
    expect(getJulian(d)).toBe('2440587.50000');
  });

  it('calculates the Mayan Long Count correctly', () => {
    const endOfCycle = new Date('2012-12-21T12:00:00Z');
    expect(getMayan(endOfCycle)).toBe('13.0.0.0.0');

    const ancient = new Date('-003500-01-01T00:00:00Z');
    expect(getMayan(ancient)).toBe('Pre-counting');
  });

  it('handles Intl.DateTimeFormat alt calendars', () => {
    const d = new Date('2026-04-08T12:00:00Z');
    const jalali = getAltCal(d, 'persian');

    expect(typeof jalali).toBe('string');
    expect(jalali.length).toBeGreaterThan(0);
  });
});
