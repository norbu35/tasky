import { cn } from '../cn';

describe('cn() utility', () => {
  describe('class merging with custom tailwind tokens', () => {
    it('should merge font-family tokens and last wins', () => {
      expect(cn('font-sans', 'font-sans-bold')).toBe('font-sans-bold');
    });

    it('should merge px tokens and last wins', () => {
      expect(cn('px-screen-x', 'px-4')).toBe('px-4');
    });

    it('should merge gap tokens and last wins', () => {
      expect(cn('gap-section', 'gap-block')).toBe('gap-block');
    });
  });

  describe('falsy value filtering', () => {
    it('should filter out undefined values', () => {
      expect(cn('base', undefined, 'extra')).toBe('base extra');
    });

    it('should filter out false values', () => {
      expect(cn('base', false, 'extra')).toBe('base extra');
    });

    it('should filter out both undefined and false', () => {
      expect(cn('base', undefined, false, 'extra')).toBe('base extra');
    });
  });

  describe('edge cases', () => {
    it('should handle empty input', () => {
      expect(cn()).toBe('');
    });

    it('should handle single class', () => {
      expect(cn('px-4')).toBe('px-4');
    });

    it('should handle multiple conflicting classes from different groups', () => {
      const result = cn('font-sans', 'gap-section', 'px-4', 'font-sans-bold', 'gap-block');
      const classes = result.split(' ');
      // Ensure last-wins for each group are present
      expect(classes).toContain('font-sans-bold');
      expect(classes).toContain('gap-block');
      expect(classes).toContain('px-4');
      // Ensure old values are removed (not as separate tokens)
      expect(classes).not.toContain('font-sans');
      expect(classes).not.toContain('gap-section');
    });

    it('should preserve non-conflicting classes', () => {
      expect(cn('bg-white', 'text-black', 'rounded-lg')).toBe('bg-white text-black rounded-lg');
    });
  });
});
