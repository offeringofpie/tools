import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  blendHEX,
  getTextColor,
  parseColor,
  parseInputToHex,
} from './ColourPalette.vue';

describe('ColourPalette Utils', () => {
  describe('hexToRgb', () => {
    it('converts a valid hex string to an rgb object', () => {
      expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('#00FF00')).toEqual({ r: 0, g: 255, b: 0 });
      expect(hexToRgb('#0000FF')).toEqual({ r: 0, g: 0, b: 255 });
      expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    });
  });

  describe('blendHEX', () => {
    it('blends two hex colors effectively by averaging their RGB values', () => {
      expect(blendHEX('#FFFFFF', '#000000')).toBe('#808080');
      expect(blendHEX('#FF0000', '#0000FF')).toBe('#800080'); // Red + Blue = Purple
      expect(blendHEX('#000000', '#000000')).toBe('#000000');
    });
  });

  describe('getTextColor', () => {
    it('returns forced white text utility classes for dark backgrounds', () => {
      expect(getTextColor('#000000')).toContain('!text-white');
      expect(getTextColor('#1A1A1A')).toContain('!text-white');
      expect(getTextColor('#0000FF')).toContain('!text-white');
    });

    it('returns forced black text utility classes for light backgrounds', () => {
      expect(getTextColor('#FFFFFF')).toContain('!text-black');
      expect(getTextColor('#F0F0F0')).toContain('!text-black');
      expect(getTextColor('#00FF00')).toContain('!text-black');
    });
  });

  describe('parseInputToHex', () => {
    it('parses standard HEX colors', () => {
      expect(parseInputToHex('#ff0000')).toBe('#FF0000');
      expect(parseInputToHex('ff0000')).toBe('#FF0000'); // Optional hash
      expect(parseInputToHex('#f00')).toBe('#FF0000'); // Shorthand
    });

    it('parses formatted RGB strings', () => {
      expect(parseInputToHex('rgb(255, 0, 0)')).toBe('#FF0000');
      expect(parseInputToHex('rgb( 0 , 255 , 0 )')).toBe('#00FF00');
    });

    it('parses formatted HSL strings', () => {
      expect(parseInputToHex('hsl(0, 100%, 50%)')).toBe('#FF0000');
      expect(parseInputToHex('hsl(120, 100, 50)')).toBe('#00FF00'); // Handles missing %
    });

    it('returns null for unparseable strings', () => {
      expect(parseInputToHex('invalid string')).toBeNull();
      expect(parseInputToHex('#FFZZZ1')).toBeNull();
      expect(parseInputToHex('rgb(255, 0)')).toBeNull();
    });
  });

  describe('parseColor', () => {
    it('returns hex unmodified (but capitalized)', () => {
      expect(parseColor('#ff0000', 'hex')).toBe('#FF0000');
    });

    it('parses to RGB correctly', () => {
      expect(parseColor('#FF0000', 'rgb')).toBe('rgb(255, 0, 0)');
      expect(parseColor('#008000', 'rgb')).toBe('rgb(0, 128, 0)');
    });

    it('parses to HSL correctly', () => {
      expect(parseColor('#FF0000', 'hsl')).toBe('hsl(0, 100%, 50%)');
      expect(parseColor('#00FF00', 'hsl')).toBe('hsl(120, 100%, 50%)');
      expect(parseColor('#0000FF', 'hsl')).toBe('hsl(240, 100%, 50%)');
      expect(parseColor('#FFFFFF', 'hsl')).toBe('hsl(0, 0%, 100%)');
    });

    it('parses to HSV correctly', () => {
      expect(parseColor('#FF0000', 'hsv')).toBe('hsv(0.0, 100.0%, 100.0%)');
      expect(parseColor('#808080', 'hsv')).toBe('hsv(0.0, 0.0%, 50.2%)');
    });

    it('parses complex perceptual formats without throwing exceptions', () => {
      const hex = '#3498db';
      expect(parseColor(hex, 'lab')).toMatch(
        /^lab\(-?\d+(\.\d+)? -?\d+(\.\d+)? -?\d+(\.\d+)?\)$/,
      );
      expect(parseColor(hex, 'oklab')).toMatch(
        /^oklab\(-?\d+(\.\d+)? -?\d+(\.\d+)? -?\d+(\.\d+)?\)$/,
      );
      expect(parseColor(hex, 'oklch')).toMatch(
        /^oklch\(-?\d+(\.\d+)? -?\d+(\.\d+)? -?\d+(\.\d+)?\)$/,
      );
    });
  });
});
