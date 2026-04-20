import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { InsetScrollView } from '@/components/shells';
import { mobileTheme } from '@/design/tokenAdapter';
import { mobileSurfaces } from '@/design/surfaces';

import { TermsErrorVisual } from './Terms.ErrorVisual';

const { colors, radius, spacing } = mobileTheme;

export const TERMS_SURFACE = {
  skeletonHeroHeight: 200,
} as const;

export type ScreenState = 'loaded' | 'loading' | 'error';

export function resolveState(value: string | string[] | undefined): ScreenState {
  const state = Array.isArray(value) ? value[0] : value;
  return state === 'loading' || state === 'error' ? state : 'loaded';
}

export { TermsErrorVisual };

export function TermsLoading() {
  return (
    <View className="flex-1 px-lg pt-xl gap-lg">
      <View
        style={{
          height: TERMS_SURFACE.skeletonHeroHeight,
          backgroundColor: colors.muted,
          borderRadius: radius.md,
        }}
      />
      <View
        style={{
          height: spacing['3xl'],
          width: '80%',
          backgroundColor: colors.muted,
          borderRadius: radius.md,
        }}
      />
      <View
        style={{
          height: spacing.xl,
          width: '55%',
          backgroundColor: colors.muted,
          borderRadius: radius.md,
        }}
      />
      <View
        style={{
          height: spacing['3xl'],
          width: '80%',
          backgroundColor: colors.muted,
          borderRadius: radius.md,
        }}
      />
    </View>
  );
}

export function TermsContent() {
  const { t } = useTranslation();

  const sections = useMemo(
    () => [
      {
        title: t('infra.terms.section0Title'),
        lead: t('infra.terms.section0Body'),
        points: [t('infra.terms.section0Note')],
      },
      {
        title: t('infra.terms.section1Title'),
        lead: t('infra.terms.section1Body'),
        points: [t('infra.terms.section1Note')],
      },
      {
        title: t('infra.terms.section2Title'),
        lead: t('infra.terms.section2Body'),
        points: [t('infra.terms.section2Note')],
      },
      {
        title: t('infra.terms.section3Title'),
        lead: t('infra.terms.section3Body'),
        points: [t('infra.terms.section3Note')],
      },
      {
        title: t('infra.terms.section4Title'),
        lead: t('infra.terms.section4Body'),
        points: [t('infra.terms.section4Note')],
      },
    ],
    [t],
  );

  return (
    <InsetScrollView
      className="flex-1"
      contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
      extraBottomInset={spacing.lg}
    >
      {sections.map((section, index) => (
        <View
          key={section.title}
          className="mb-lg p-lg"
          style={{ backgroundColor: colors.muted, borderRadius: radius.md }}
        >
          <Text
            className="text-subtitle font-sans-semibold mb-sm"
            style={{ color: colors.primaryDeep }}
          >
            {section.title}
          </Text>
          <Text
            className="text-body"
            style={{ color: colors.textSecondary, lineHeight: mobileSurfaces.paragraphLineHeight }}
          >
            {section.lead}
          </Text>
          {index === 0 ? (
            <Text
              className="text-body mb-lg"
              style={{
                color: colors.textSecondary,
                lineHeight: mobileSurfaces.paragraphLineHeight,
              }}
            >
              <Text className="font-sans-bold" style={{ color: colors.primaryDeep }}>
                {t('shared.legal.noteLabel')}
              </Text>
              {section.points[0]}
            </Text>
          ) : null}
          <View className="mt-sm gap-sm">
            {section.points.map((point) => (
              <View key={point} className="flex-row items-start gap-sm">
                <Text
                  className="text-body"
                  style={{
                    color: colors.primaryDeep,
                    lineHeight: mobileSurfaces.paragraphLineHeight,
                  }}
                >
                  •
                </Text>
                <Text
                  className="text-body flex-1"
                  style={{
                    color: colors.foreground,
                    lineHeight: mobileSurfaces.paragraphLineHeight,
                  }}
                >
                  {point}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </InsetScrollView>
  );
}
