import React, { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/Button';
import { InsetScrollView, ScreenContainer } from '../../../components/shells';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, radius, spacing } = mobileTheme;

type ScreenState = 'loaded' | 'loading' | 'error';

function resolveState(value: string | string[] | undefined): ScreenState {
  const state = Array.isArray(value) ? value[0] : value;
  return state === 'loading' || state === 'error' ? state : 'loaded';
}

function TermsLoading() {
  return (
    <View className="flex-1 px-lg pt-xl gap-lg">
      <View style={{ height: 200, backgroundColor: colors.muted, borderRadius: radius.md }} />
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
          width: 88,
          height: 108,
          borderRadius: radius.lg,
          backgroundColor: colors.muted,
          padding: 12,
          gap: 8,
          position: 'relative',
        }}
      >
        <View
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 28,
            height: 28,
            backgroundColor: colors.border,
            borderTopRightRadius: radius.lg,
            borderBottomLeftRadius: radius.md,
          }}
        />
        <View
          style={{
            height: 8,
            width: '60%',
            borderRadius: radius.xs,
            backgroundColor: colors.border,
            marginTop: spacing.lg,
          }}
        />
        <View
          style={{
            height: 8,
            alignSelf: 'stretch',
            borderRadius: radius.xs,
            backgroundColor: colors.border,
          }}
        />
        <View
          style={{
            height: 8,
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
          width: 28,
          height: 28,
          borderRadius: 14,
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
          <Text className="text-body" style={{ color: colors.textSecondary, lineHeight: 24 }}>
            {section.lead}
          </Text>
          {index === 0 ? (
            <Text
              className="text-body mb-lg"
              style={{ color: colors.textSecondary, lineHeight: 24 }}
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
                <Text className="text-body" style={{ color: colors.primaryDeep, lineHeight: 24 }}>
                  •
                </Text>
                <Text
                  className="text-body flex-1"
                  style={{ color: colors.foreground, lineHeight: 24 }}
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
  const [state, setState] = useState<ScreenState>(() => resolveState(params.state));

  useEffect(() => {
    setState(resolveState(params.state));
  }, [params.state]);

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
