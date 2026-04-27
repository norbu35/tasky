import { cn } from '../cn';

describe('cn() utility', () => {
  describe('class merging with custom tailwind tokens', () => {
    it('should merge font-family tokens and last wins', () => {
      expect(cn('font-sans', 'font-sans-bold')).toBe('font-sans-bold');
    });

    it('should merge px tokens and last wins', () => {
      expect(cn('px-screen-x', 'px-4')).toBe('px-4');
    });

    it('should merge px-action-bar with other px classes', () => {
      expect(cn('px-action-bar', 'px-4')).toBe('px-4');
      expect(cn('px-4', 'px-action-bar')).toBe('px-action-bar');
    });

    it('should merge pt-action-bar with other pt classes', () => {
      expect(cn('pt-action-bar', 'pt-4')).toBe('pt-4');
      expect(cn('pt-4', 'pt-action-bar')).toBe('pt-action-bar');
    });

    it('should merge gap tokens and last wins', () => {
      expect(cn('gap-section', 'gap-block')).toBe('gap-block');
    });

    it('should merge kebab-case typography tokens and last wins', () => {
      expect(cn('text-hero-title', 'text-heading')).toBe('text-heading');
      expect(cn('text-body', 'text-nav-label')).toBe('text-nav-label');
    });

    it('should merge interaction state tokens and last wins', () => {
      expect(cn('active:opacity-pressed', 'active:opacity-80')).toBe('active:opacity-80');
      expect(cn('disabled:opacity-disabled', 'disabled:opacity-50')).toBe('disabled:opacity-50');
      expect(cn('active:scale-pressed', 'active:scale-95')).toBe('active:scale-95');
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
