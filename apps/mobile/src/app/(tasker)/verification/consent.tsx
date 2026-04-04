import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ExternalLink } from 'lucide-react-native';
import { Button } from '../../../components/ui/Button';
import { InsetScrollView, ScreenContainer, StickyActionBar } from '../../../components/shells';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, typography, radius } = mobileTheme;

export default function ConsentScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const dataItems = [
    t(
      'tasker.verification.consentIdPhotos',
      'Иргэний үнэмлэхний зураг (урд, ар тал)',
    ),
    t('tasker.verification.uploadSelfie', 'Амьд зураг (selfie)'),
    t('tasker.verification.consentPurpose', 'Таниулах баталгаажуулалт'),
    t(
      'tasker.verification.consentRetention',
      'Бүртгэл хүчинтэй байх хугацаанд хадгалагдана',
    ),
    t(
      'tasker.verification.consentDeletion',
      'Бүртгэл устгахад мэдээлэл устгагдана',
    ),
  ];

  const handleScroll = (event: any) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const reachedBottom =
      contentOffset.y + layoutMeasurement.height >= contentSize.height - spacing.lg;
    if (reachedBottom) {
      setHasScrolledToEnd(true);
    }
  };

  return (
    <ScreenContainer testID="SCR-TASK-004">
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.headerAction}
          hitSlop={spacing.sm}
          testID="consent-screen-back"
        >
          <ChevronLeft size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('tasker.verification.consentTitle')}</Text>
        <View style={styles.headerAction} />
      </View>

      <InsetScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        testID="consent-scroll"
        extraBottomInset={96}
      >
        <Text style={styles.heading}>{t('tasker.verification.consentTitle')}</Text>
        <Text style={styles.body}>{t('tasker.verification.consentBody')}</Text>

        <View style={styles.dataItems} testID="consent-data-items">
          {dataItems.map((item) => (
            <Text key={item} style={styles.dataItem}>
              {item}
            </Text>
          ))}
        </View>

        <Pressable
          style={styles.linkRow}
          onPress={() => router.push('/(shared)/legal/privacy')}
          testID="consent-privacy-link"
        >
          <Text style={styles.linkText}>{t('tasker.verification.consentPrivacy')}</Text>
          <ExternalLink size={18} color={colors.accent} />
        </Pressable>
      </InsetScrollView>

      <StickyActionBar>
        <View style={styles.bottomBar}>
          <Button
            label={t('tasker.verification.consentContinue')}
            onPress={() => router.push('/(tasker)/verification/upload')}
            disabled={!hasScrolledToEnd}
            style={styles.cta}
            testID="consent-screen-cta"
          />
        </View>
      </StickyActionBar>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  headerAction: {
    width: spacing['3xl'],
    height: spacing['3xl'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.subtitle,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  heading: {
    fontSize: typography.heading,
    fontWeight: '800',
    color: colors.primaryDeep,
    lineHeight: typography.heading * 1.2,
  },
  body: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: typography.body * 1.6,
  },
  dataItems: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
  },
  dataItem: {
    fontSize: typography.body,
    color: colors.primary,
    lineHeight: typography.body * 1.6,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
  },
  linkText: {
    fontSize: typography.body,
    color: colors.accent,
    fontWeight: '500',
  },
  bottomBar: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  cta: {
    alignSelf: 'stretch',
  },
});
