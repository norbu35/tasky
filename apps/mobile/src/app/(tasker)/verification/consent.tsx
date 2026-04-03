import React, { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ExternalLink } from 'lucide-react-native';
import { Button } from '../../../components/ui/Button';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, typography, radius } = mobileTheme;

export default function ConsentScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);

  const handleScroll = (event: any) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const reachedBottom =
      contentOffset.y + layoutMeasurement.height >= contentSize.height - spacing.lg;
    if (reachedBottom) {
      setHasScrolledToEnd(true);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} testID="consent-screen">
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        testID="consent-scroll"
      >
        <Text style={styles.heading}>{t('tasker.verification.consentTitle')}</Text>
        <Text style={styles.body}>{t('tasker.verification.consentBody')}</Text>

        <View style={styles.dataItems} testID="consent-data-items">
          <Text style={styles.dataItem}>{t('tasker.verification.uploadFront')}</Text>
          <Text style={styles.dataItem}>{t('tasker.verification.uploadBack')}</Text>
          <Text style={styles.dataItem}>{t('tasker.verification.uploadSelfie')}</Text>
        </View>

        <Pressable
          style={styles.linkRow}
          onPress={() => router.push('/(shared)/legal/privacy')}
          testID="consent-privacy-link"
        >
          <Text style={styles.linkText}>{t('tasker.verification.consentPrivacy')}</Text>
          <ExternalLink size={18} color={colors.accent} />
        </Pressable>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button
          label={t('tasker.verification.consentContinue')}
          onPress={() => router.push('/(tasker)/verification/upload')}
          disabled={!hasScrolledToEnd}
          style={styles.cta}
          testID="consent-screen-cta"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
    fontSize: 24,
    fontWeight: '800',
    color: colors.primaryDeep,
    lineHeight: 24 * 1.2,
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
    padding: spacing.md,
    backgroundColor: colors.card,
  },
  cta: {
    alignSelf: 'stretch',
  },
});
