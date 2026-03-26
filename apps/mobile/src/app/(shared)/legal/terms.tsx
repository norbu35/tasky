import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/Button';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

type ScreenState = 'loaded' | 'loading' | 'error';

function resolveState(value: string | string[] | undefined): ScreenState {
  const state = Array.isArray(value) ? value[0] : value;
  return state === 'loading' || state === 'error' ? state : 'loaded';
}

function TermsLoading() {
  return (
    <View style={styles.loadingContainer} testID="terms-screen-loading">
      <View style={styles.loadingBlockLarge} />
      <View style={styles.loadingBlockMedium} />
      <View style={styles.loadingBlockShort} />
      <View style={styles.loadingBlockMedium} />
    </View>
  );
}

function TermsErrorVisual() {
  return (
    <View style={styles.errorVisual} accessibilityRole="image">
      <View style={styles.errorDocument}>
        <View style={styles.errorDocumentFold} />
        <View style={styles.errorDocumentLineShort} />
        <View style={styles.errorDocumentLine} />
        <View style={styles.errorDocumentLine} />
      </View>
      <View style={styles.errorBadge}>
        <Text style={styles.errorBadgeText}>!</Text>
      </View>
    </View>
  );
}

function TermsContent() {
  const { t } = useTranslation();

  const sections = useMemo(
    () => [
      {
        title: t('infra.terms.section0Title', 'These Terms at a glance'),
        lead: t(
          'infra.terms.section0Body',
          'Please read these terms carefully. They explain how Tasky works, what you can expect from the service, and which responsibilities remain with you.',
        ),
        points: [
          t(
            'infra.terms.section0Note',
            'This summary is not a substitute for the full policy below.',
          ),
        ],
      },
      {
        title: t('infra.terms.section1Title', '1. Acceptance of Terms'),
        lead: t(
          'infra.terms.section1Body',
          'By accessing or using the Tasky application, you agree to be bound by these Terms of Service and all applicable laws and regulations.',
        ),
        points: [
          t('infra.terms.section1Note', 'If you do not agree, please stop using the application.'),
        ],
      },
      {
        title: t('infra.terms.section2Title', '2. Use of Service'),
        lead: t(
          'infra.terms.section2Body',
          'Tasky provides a platform connecting customers with service providers. You agree to use the service only for lawful purposes.',
        ),
        points: [
          t(
            'infra.terms.section2Note',
            'You are responsible for the accuracy of the information you submit.',
          ),
        ],
      },
      {
        title: t('infra.terms.section3Title', '3. User Accounts'),
        lead: t(
          'infra.terms.section3Body',
          'You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.',
        ),
        points: [
          t(
            'infra.terms.section3Note',
            'Keep your contact details current so we can reach you about bookings and support.',
          ),
        ],
      },
      {
        title: t('infra.terms.section4Title', '4. Liability'),
        lead: t(
          'infra.terms.section4Body',
          'Tasky acts solely as a connector between task posters and taskers. Tasky does not process payments, employ taskers, or guarantee work quality.',
        ),
        points: [
          t(
            'infra.terms.section4Note',
            'Any direct agreement between customers and taskers remains their own responsibility.',
          ),
        ],
      },
    ],
    [t],
  );

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {sections.map((section, index) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionBody}>{section.lead}</Text>
          {index === 0 ? (
            <Text style={styles.sectionLead}>
              <Text style={styles.sectionLeadStrong}>Note: </Text>
              {section.points[0]}
            </Text>
          ) : null}
          <View style={styles.clauses}>
            {section.points.map((point) => (
              <View key={point} style={styles.clauseRow}>
                <Text style={styles.clauseBullet}>•</Text>
                <Text style={styles.clauseText}>{point}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

export default function TermsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [state, setState] = useState<ScreenState>(() => resolveState(params.state));

  useEffect(() => {
    setState(resolveState(params.state));
  }, [params.state]);

  const title = t('infra.terms.title', 'Terms of Service');

  return (
    <SafeAreaView style={styles.safeArea} testID="terms-screen">
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={spacing.sm}
          testID="terms-screen-back"
        >
          <ChevronLeft size={24} color={colors.primary} />
          <Text style={styles.backLabel}>{t('infra.terms.backLabel', 'Back')}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerAction} />
      </View>

      {state === 'loading' ? (
        <TermsLoading />
      ) : state === 'error' ? (
        <View style={styles.errorContainer}>
          <TermsErrorVisual />
          <Text style={styles.errorHeadline}>
            {t('infra.terms.errorHeadline', 'Unable to load')}
          </Text>
          <Text style={styles.errorDescription}>
            {t('infra.terms.errorDescription', 'Failed to load Terms of Service. Please try again')}
          </Text>
          <Button
            label={t('infra.terms.errorRetry', 'Try again')}
            onPress={() => setState('loaded')}
            style={styles.errorButton}
          />
        </View>
      ) : (
        <TermsContent />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 56,
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
  backButton: {
    minHeight: 44,
    paddingHorizontal: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backLabel: {
    fontSize: typography.body,
    fontWeight: '500',
    color: colors.primary,
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
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionLead: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: typography.body * 1.6,
    marginBottom: spacing.lg,
  },
  sectionLeadStrong: {
    fontWeight: '700',
    color: colors.primary,
  },
  sectionTitle: {
    fontSize: typography.subtitle,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  sectionBody: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: typography.body * 1.6,
  },
  clauses: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  clauseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  clauseBullet: {
    fontSize: typography.body,
    lineHeight: typography.body * 1.5,
    color: colors.primary,
    marginTop: 1,
  },
  clauseText: {
    fontSize: typography.body,
    color: colors.foreground,
    lineHeight: typography.body * 1.5,
    flex: 1,
  },
  clauseStrong: {
    fontWeight: '600',
    color: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  loadingBlockLarge: {
    height: 200,
    backgroundColor: colors.muted,
    borderRadius: mobileTheme.radius.md,
  },
  loadingBlockMedium: {
    height: spacing['3xl'],
    width: '80%',
    backgroundColor: colors.muted,
    borderRadius: mobileTheme.radius.md,
  },
  loadingBlockShort: {
    height: spacing.xl,
    width: '55%',
    backgroundColor: colors.muted,
    borderRadius: mobileTheme.radius.md,
  },
  errorContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    alignItems: 'center',
  },
  errorVisual: {
    width: 128,
    height: 128,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  errorDocument: {
    width: 88,
    height: 108,
    borderRadius: mobileTheme.radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: spacing.md,
    gap: spacing.sm,
    position: 'relative',
  },
  errorDocumentFold: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 28,
    height: 28,
    backgroundColor: colors.muted,
    borderTopRightRadius: mobileTheme.radius.lg,
    borderBottomLeftRadius: mobileTheme.radius.md,
  },
  errorDocumentLineShort: {
    height: 8,
    width: '60%',
    borderRadius: mobileTheme.radius.xs,
    backgroundColor: colors.muted,
    marginTop: spacing.lg,
  },
  errorDocumentLine: {
    height: 8,
    width: '100%',
    borderRadius: mobileTheme.radius.xs,
    backgroundColor: colors.muted,
  },
  errorBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBadgeText: {
    color: colors.dangerForeground,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  errorDescription: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.body * 1.6,
  },
  errorButton: {
    marginTop: spacing.xl,
    alignSelf: 'stretch',
  },
  errorHeadline: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
