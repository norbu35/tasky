import { Platform, type ViewStyle } from 'react-native';

import { nativeTokens } from '@tasky/design-tokens';

const elevationLayers = nativeTokens.elevation;
const nativeOverlays = nativeTokens.overlays;
const { shadows } = nativeTokens;

type ShadowToken = (typeof shadows)[keyof typeof shadows];

const toShadowStyle = (shadow: ShadowToken): ViewStyle => ({
  shadowColor: shadow.color,
  shadowOffset: shadow.offset,
  shadowOpacity: shadow.opacity,
  shadowRadius: shadow.radius,
  ...(Platform.OS === 'android' && { elevation: shadow.elevation }),
});

export const elevations = {
  none: {},
  soft: toShadowStyle(shadows.card),
  card: toShadowStyle(shadows.card),
  elevated: toShadowStyle(elevationLayers.sheet.shadow),
  fab: toShadowStyle(shadows.fab),
  navBar: toShadowStyle(shadows.navBar),
  sheet: { ...toShadowStyle(elevationLayers.sheet.shadow), zIndex: elevationLayers.sheet.zIndex },
  modal: { ...toShadowStyle(elevationLayers.modal.shadow), zIndex: elevationLayers.modal.zIndex },
  toast: { zIndex: elevationLayers.toast.zIndex },
} as const satisfies Record<string, ViewStyle>;

export const elevationZIndex = elevationLayers;

export const overlays = {
  modal: nativeOverlays.scrim.modal,
  sheet: nativeOverlays.scrim.sheet,
  toast: nativeOverlays.scrim.toastBackdrop,
} as const;
