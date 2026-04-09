import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toText } from './CronHelper.vue';

describe('CronHelper', () => {
  describe('toText()', () => {
    it('translates a valid cron string', () => {
      expect(toText('0 4 * * *')).toBe('At 04:00');
      expect(toText('*/15 * * * *')).toBe('Every 15 minutes');
    });

    it('returns a specific message for empty inputs', () => {
      expect(toText('')).toBe('Enter a cron expression');
      expect(toText('   ')).toBe('Enter a cron expression');
    });

    it('returns an error string for invalid inputs', () => {
      expect(toText('invalid string')).toBe('Invalid cron expression');
      expect(toText('99 99 * * *')).toBe('Invalid cron expression');
    });
  });
});
