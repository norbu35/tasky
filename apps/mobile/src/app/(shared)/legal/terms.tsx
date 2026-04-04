import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/Button';
import { InsetScrollView, ScreenContainer } from '../../../components/shells';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, typography, radius } = mobileTheme;

type ScreenState = 'loaded' | 'loading' | 'error';

function resolveState(value: string | string[] | undefined): ScreenState {
  const state = Array.isArray(value) ? value[0] : value;
  return state === 'loading' || state === 'error' ? state : 'loaded';
}

function TermsLoading() {
  return (
    <View testID="SCR-INFRA-004" style={styles.loadingContainer}>
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
        title: t('infra.terms.section0Title', 'Эдгээр нөхцөлийг товчоор'),
        lead: t(
          'infra.terms.section0Body',
          'Эдгээр нөхцөлийг анхааралтай уншина уу. Тэд Tasky хэрхэн ажилладаг, үйлчилгээнээс юу хүлээх, ямар хариуцлага танд үлдэхийг тайлбарлана.',
        ),
        points: [t('infra.terms.section0Note', 'Энэ товч тайлбар нь доорх бүрэн журмыг орлохгүй.')],
      },
      {
        title: t('infra.terms.section1Title', '1. Нөхцөлийг зөвшөөрөх'),
        lead: t(
          'infra.terms.section1Body',
          'Tasky-г ашигласнаар та эдгээр нөхцөл болон холбогдох бүх хуулийг зөвшөөрч байна.',
        ),
        points: [
          t(
            'infra.terms.section1Note',
            'Хэрэв та зөвшөөрөхгүй бол аппликейшнийг ашиглахаа зогсооно уу.',
          ),
        ],
      },
      {
        title: t('infra.terms.section2Title', '2. Үйлчилгээний хэрэглээ'),
        lead: t(
          'infra.terms.section2Body',
          'Tasky нь захиалагч болон үйлчилгээ үзүүлэгчийг холбодог. Зөвхөн хууль ёсны зорилгоор ашиглана уу.',
        ),
        points: [
          t('infra.terms.section2Note', 'Оруулж буй мэдээллийн үнэн зөвийг та өөрөө хариуцна.'),
        ],
      },
      {
        title: t('infra.terms.section3Title', '3. Хэрэглэгчийн бүртгэл'),
        lead: t(
          'infra.terms.section3Body',
          'Та өөрийн нэвтрэх мэдээлэл болон бүртгэл дээрх бүх үйлдлийн хариуцлагыг хариуцна.',
        ),
        points: [
          t(
            'infra.terms.section3Note',
            'Захиалга болон дэмжлэгийн мэдээлэл хүрэхийн тулд холбоо барих мэдээллээ шинэ байлгаарай.',
          ),
        ],
      },
      {
        title: t('infra.terms.section4Title', '4. Хариуцлага'),
        lead: t(
          'infra.terms.section4Body',
          'Tasky нь захиалагч болон гүйцэтгэгчийг холбох үүрэгтэй бөгөөд ажлын чанарыг баталгаажуулахгүй.',
        ),
        points: [
          t(
            'infra.terms.section4Note',
            'Захиалагч болон гүйцэтгэгчийн хоорондын шууд тохиролцоо нь өөрсдийн хариуцлага байна.',
          ),
        ],
      },
    ],
    [t],
  );

  return (
    <InsetScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      extraBottomInset={spacing.lg}
    >
      {sections.map((section, index) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionBody}>{section.lead}</Text>
          {index === 0 ? (
            <Text style={styles.sectionLead}>
              <Text style={styles.sectionLeadStrong}>Санамж: </Text>
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
    </InsetScrollView>
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

  const title = t('infra.terms.title', 'Үйлчилгээний нөхцөл');

  return (
    <ScreenContainer testID="terms-screen">
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={spacing.sm}
          testID="terms-screen-back"
        >
          <ChevronLeft size={24} color={colors.primary} />
          <Text style={styles.backLabel}>{t('infra.terms.backLabel', 'Буцах')}</Text>
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
            {t('infra.terms.errorHeadline', 'Ачааллах боломжгүй')}
          </Text>
          <Text style={styles.errorDescription}>
            {t(
              'infra.terms.errorDescription',
              'Үйлчилгээний нөхцлийг ачааллахад алдаа гарлаа. Дахин оролдоно уу',
            )}
          </Text>
          <Button
            label={t('infra.terms.errorRetry', 'Дахин оролдох')}
            onPress={() => setState('loaded')}
            style={styles.errorButton}
          />
        </View>
      ) : (
        <TermsContent />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
    color: colors.primaryDeep,
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.subtitle,
    fontWeight: '600',
    color: colors.primaryDeep,
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
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  sectionLead: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  sectionLeadStrong: {
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  sectionTitle: {
    fontSize: typography.subtitle,
    fontWeight: '600',
    color: colors.primaryDeep,
    marginBottom: spacing.sm,
  },
  sectionBody: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
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
    color: colors.primaryDeep,
    marginTop: spacing.xs / 4,
  },
  clauseText: {
    fontSize: typography.body,
    color: colors.foreground,
    lineHeight: typography.body * 1.5,
    flex: 1,
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
    backgroundColor: colors.muted,
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
    backgroundColor: colors.border,
    borderTopRightRadius: mobileTheme.radius.lg,
    borderBottomLeftRadius: mobileTheme.radius.md,
  },
  errorDocumentLineShort: {
    height: 8,
    width: '60%',
    borderRadius: mobileTheme.radius.xs,
    backgroundColor: colors.border,
    marginTop: spacing.lg,
  },
  errorDocumentLine: {
    height: 8,
    alignSelf: 'stretch',
    borderRadius: mobileTheme.radius.xs,
    backgroundColor: colors.border,
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
    color: colors.foreground,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
