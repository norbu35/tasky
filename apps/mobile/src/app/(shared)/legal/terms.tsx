import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { InsetScrollView, ScreenContainer } from '../../../components/shells';
import { Button } from '../../../components/ui/Button';
import { mobileSurfaces, mobileTheme } from '../../../design/tokenAdapter';

const { colors, radius, spacing } = mobileTheme;
const { errorDocument, skeletonHeroHeight } = mobileSurfaces.terms;

type ScreenState = 'loaded' | 'loading' | 'error';

function resolveState(value: string | string[] | undefined): ScreenState {
  const state = Array.isArray(value) ? value[0] : value;
  return state === 'loading' || state === 'error' ? state : 'loaded';
}

function TermsLoading() {
  return (
    <View className="flex-1 px-lg pt-xl gap-lg">
      <View
        style={{
          height: skeletonHeroHeight,
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

function TermsErrorVisual() {
  return (
    <View
      className="w-[128px] h-[128px] items-center justify-center mb-lg"
      accessibilityRole="image"
    >
      <View
        style={{
          width: errorDocument.width,
          height: errorDocument.height,
          borderRadius: radius.lg,
          backgroundColor: colors.muted,
          padding: errorDocument.innerPadding,
          gap: errorDocument.rowGap,
          position: 'relative',
        }}
      >
        <View
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: errorDocument.foldSize,
            height: errorDocument.foldSize,
            backgroundColor: colors.border,
            borderTopRightRadius: radius.lg,
            borderBottomLeftRadius: radius.md,
          }}
        />
        <View
          style={{
            height: errorDocument.rowHeight,
            width: '60%',
            borderRadius: radius.xs,
            backgroundColor: colors.border,
            marginTop: spacing.lg,
          }}
        />
        <View
          style={{
            height: errorDocument.rowHeight,
            alignSelf: 'stretch',
            borderRadius: radius.xs,
            backgroundColor: colors.border,
          }}
        />
        <View
          style={{
            height: errorDocument.rowHeight,
            alignSelf: 'stretch',
            borderRadius: radius.xs,
            backgroundColor: colors.border,
          }}
        />
      </View>
      <View
        style={{
          position: 'absolute',
          bottom: 6,
          right: 6,
          width: errorDocument.exclamationSize,
          height: errorDocument.exclamationSize,
          borderRadius: errorDocument.markerRadius,
          backgroundColor: colors.danger,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text className="text-caption font-sans-bold" style={{ color: colors.dangerForeground }}>
          !
        </Text>
      </View>
    </View>
  );
}

function TermsContent() {
  const { t } = useTranslation();

  const sections = useMemo(
    () => [
      {
        title: t('infra.terms.section0Title'),
        lead: t('TermsScreen.copy1'),
        points: [t('infra.terms.section0Note')],
      },
      {
        title: t('infra.terms.section1Title'),
        lead: t('TermsScreen.copy2'),
        points: [t('TermsScreen.copy3')],
      },
      {
        title: t('infra.terms.section2Title'),
        lead: t('TermsScreen.copy4'),
        points: [t('infra.terms.section2Note')],
      },
      {
        title: t('infra.terms.section3Title'),
        lead: t('TermsScreen.copy5'),
        points: [t('TermsScreen.copy6')],
      },
      {
        title: t('infra.terms.section4Title'),
        lead: t('TermsScreen.copy7'),
        points: [t('TermsScreen.copy8')],
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

export default function TermsScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const paramsState = params['state'];
  const [state, setState] = useState<ScreenState>(() => resolveState(paramsState));

  useEffect(() => {
    setState(resolveState(paramsState));
  }, [paramsState]);

  return (
    <ScreenContainer testID="SCR-INFRA-004">
      {state === 'loading' ? (
        <TermsLoading />
      ) : state === 'error' ? (
        <View className="flex-1 px-lg pt-xl items-center">
          <TermsErrorVisual />
          <Text
            className="text-title font-sans-bold text-center mb-sm"
            style={{ color: colors.foreground }}
          >
            {t('infra.terms.errorHeadline')}
          </Text>
          <Text
            className="text-body text-center"
            style={{ color: colors.textSecondary, lineHeight: 26 }}
          >
            {t('TermsScreen.copy9')}
          </Text>
          <Button
            label={t('infra.terms.errorRetry')}
            onPress={() => setState('loaded')}
            style={{ marginTop: spacing.xl, alignSelf: 'stretch' }}
          />
        </View>
      ) : (
        <TermsContent />
      )}
    </ScreenContainer>
  );
}
