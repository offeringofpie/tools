import { describe, it, expect } from 'vitest';
import { convert, format } from './UnitConverter.vue';

describe('UnitConverter', () => {
  describe('format()', () => {
    it('returns strings as strings', () => {
      expect(format('A3F')).toBe('A3F');
      expect(format('1010')).toBe('1010');
    });

    it('returns "0" when 0', () => {
      expect(format(0)).toBe('0');
    });

    it('formats string numbers', () => {
      expect(format(123.45)).toBe('123.45');
      expect(format(-273.15)).toBe('-273.15');
    });

    it('uses exponential notation for big numbers', () => {
      expect(format(1500000000000)).toBe('1.5000e+12');
    });

    it('uses exponential notation for small numbers', () => {
      expect(format(0.0000001)).toBe('1.0000e-7');
    });
  });

  describe('convert()', () => {
    describe('Ratio conversions', () => {
      it('converts m to cm', () => {
        expect(convert(1, 'm', 'cm', 'length')).toBe(100);
      });

      it('converts miles to km', () => {
        expect(convert(1, 'mi', 'km', 'length')).toBe(1.609344);
      });

      it('converts kg to g', () => {
        expect(convert(1.5, 'kg', 'g', 'weight')).toBe(1500);
      });

      it('converts same to same', () => {
        expect(convert(42, 'm', 'm', 'length')).toBe(42);
        expect(convert(42, 'lb', 'lb', 'weight')).toBe(42);
      });
    });

    describe('Temperature', () => {
      it('converts Celsius / Fahrenheit', () => {
        expect(convert(0, 'c', 'f', 'temperature')).toBe(32);
        expect(convert(788, 'f', 'c', 'temperature')).toBe(420);
      });

      it('converts Kelvin / Celsius', () => {
        expect(convert(0, 'k', 'c', 'temperature')).toBe(-273.15);
      });

      it('converts Fahrenheit / Kelvin', () => {
        expect(convert(32, 'f', 'k', 'temperature')).toBe(273.15);
      });
    });

    describe('Number Bases', () => {
      it('converts Decimal to Hexadecimal', () => {
        expect(convert(255, 'dec', 'hex', 'numbers')).toBe('FF');
      });

      it('converts Hexadecimal to Binary', () => {
        expect(convert('FF' as any, 'hex', 'bin', 'numbers')).toBe('11111111');
      });

      it('converts Binary to Decimal', () => {
        expect(convert('1010' as any, 'bin', 'dec', 'numbers')).toBe('10');
      });
    });

    describe('Edge Cases', () => {
      it('returns "" for empty of undefined', () => {
        expect(convert(undefined as any, 'm', 'cm', 'length')).toBe('');
        expect(convert('' as any, 'm', 'cm', 'length')).toBe('');
      });

      it('converts safely to 0', () => {
        expect(convert(0, 'm', 'cm', 'length')).toBe(0);
      });
    });
  });
});
