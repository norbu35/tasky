import { durations, easings, animationPresets, interactiveStates } from '../../src/design/animations';
import { elevations, overlays } from '../../src/design/elevations';

describe('design tokens — animations', () => {
    it('durations has all expected keys', () => {
        expect(durations).toHaveProperty('instant');
        expect(durations).toHaveProperty('fast');
        expect(durations).toHaveProperty('normal');
        expect(durations).toHaveProperty('slow');
        expect(durations).toHaveProperty('skeleton');
    });

    it('durations values are positive numbers in ascending order', () => {
        expect(durations.instant).toBeGreaterThan(0);
        expect(durations.fast).toBeGreaterThan(durations.instant);
        expect(durations.normal).toBeGreaterThan(durations.fast);
        expect(durations.slow).toBeGreaterThan(durations.normal);
        expect(durations.skeleton).toBeGreaterThan(durations.slow);
    });

    it('easings has all expected keys', () => {
        expect(easings).toHaveProperty('standard');
        expect(easings).toHaveProperty('decelerate');
        expect(easings).toHaveProperty('accelerate');
        expect(easings).toHaveProperty('spring');
    });

    it('animationPresets map to correct durations and easings', () => {
        expect(animationPresets.press.duration).toBe(durations.instant);
        expect(animationPresets.press.easing).toBe(easings.standard);

        expect(animationPresets.enter.duration).toBe(durations.normal);
        expect(animationPresets.enter.easing).toBe(easings.decelerate);

        expect(animationPresets.sheetOpen.duration).toBe(durations.slow);
        expect(animationPresets.sheetOpen.easing).toBe(easings.decelerate);

        expect(animationPresets.sheetClose.duration).toBe(durations.normal);
        expect(animationPresets.sheetClose.easing).toBe(easings.accelerate);

        expect(animationPresets.fade.duration).toBe(durations.fast);
        expect(animationPresets.fade.easing).toBe(easings.standard);

        expect(animationPresets.skeleton.duration).toBe(durations.skeleton);
        expect(animationPresets.skeleton.easing).toBe(easings.standard);

        expect(animationPresets.celebration.duration).toBe(durations.slow);
        expect(animationPresets.celebration.easing).toBe(easings.spring);
    });

    it('interactiveStates.pressed has correct opacity and scale', () => {
        expect(interactiveStates.pressed.opacity).toBe(0.85);
        expect(interactiveStates.pressed.scale).toBe(0.98);
    });
});

describe('design tokens — elevations', () => {
    it('has none, card, elevated, navBar keys', () => {
        expect(elevations).toHaveProperty('none');
        expect(elevations).toHaveProperty('card');
        expect(elevations).toHaveProperty('elevated');
        expect(elevations).toHaveProperty('navBar');
    });

    it('elevations.none is an empty object', () => {
        expect(elevations.none).toEqual({});
    });

    it('elevations.card has correct shadow properties', () => {
        expect(elevations.card).toHaveProperty('shadowColor');
        expect(elevations.card).toHaveProperty('shadowOffset');
        expect(elevations.card).toHaveProperty('shadowOpacity');
        expect(elevations.card).toHaveProperty('shadowRadius');
    });

    it('elevations.elevated has correct shadow properties', () => {
        expect(elevations.elevated).toHaveProperty('shadowColor');
        expect(elevations.elevated).toHaveProperty('shadowOffset');
        expect(elevations.elevated).toHaveProperty('shadowOpacity');
        expect(elevations.elevated).toHaveProperty('shadowRadius');
    });
});

describe('design tokens — overlays', () => {
    it('has modal, sheet, toast keys', () => {
        expect(overlays).toHaveProperty('modal');
        expect(overlays).toHaveProperty('sheet');
        expect(overlays).toHaveProperty('toast');
    });

    it('overlays use branded rgba(16, 38, 56) not generic black', () => {
        // branded primaryDeep rgb(16, 38, 56) = #102638
        expect(overlays.modal).toContain('16, 38, 56');
        expect(overlays.sheet).toContain('16, 38, 56');
        expect(overlays.toast).toContain('16, 38, 56');

        // Must NOT be generic black rgba(0, 0, 0, ...)
        expect(overlays.modal).not.toContain('0, 0, 0');
        expect(overlays.sheet).not.toContain('0, 0, 0');
        expect(overlays.toast).not.toContain('0, 0, 0');
    });

    it('overlays have descending opacity: modal > sheet > toast', () => {
        const extractOpacity = (rgba: string) => parseFloat(rgba.split(',').pop()!.replace(')', ''));
        const modalOpacity = extractOpacity(overlays.modal);
        const sheetOpacity = extractOpacity(overlays.sheet);
        const toastOpacity = extractOpacity(overlays.toast);

        expect(modalOpacity).toBeGreaterThan(sheetOpacity);
        expect(sheetOpacity).toBeGreaterThan(toastOpacity);
    });
});
