import { LinearGradient } from 'expo-linear-gradient';
import { Shield, Star } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, CardContent, ProfileAvatar } from '../../../components/ui';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, radius, spacing, typography } = mobileTheme;

interface TaskerInfo {
  name: string;
  avatarUri?: string | null;
  rating: number;
  reviewCount: number;
  isVerified?: boolean;
}

interface BookingSummary {
  date: string;
  time: string;
  budget: string;
}

interface BookingConfirmationProps {
  taskTitle: string;
  tasker: TaskerInfo;
  summary: BookingSummary;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function BookingConfirmation({
  taskTitle,
  tasker,
  summary,
  onConfirm,
  onCancel,
  isLoading = false,
}: BookingConfirmationProps) {
  const { t } = useTranslation();
  const [termsAccepted, setTermsAccepted] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerLabel}>{t('booking.confirmTitle')}</Text>
          <Text style={styles.taskTitle} numberOfLines={2}>
            {taskTitle}
          </Text>
        </View>

        {/* Tasker Info Card */}
        <Card style={styles.card}>
          <CardContent style={styles.taskerContent}>
            <ProfileAvatar
              uri={tasker.avatarUri}
              name={tasker.name}
              size="lg"
              showVerified={tasker.isVerified}
            />
            <View style={styles.taskerDetails}>
              <Text style={styles.taskerName}>{tasker.name}</Text>
              <View style={styles.ratingRow}>
                <Star size={16} color={colors.accent} fill={colors.accent} />
                <Text style={styles.ratingText}>{tasker.rating.toFixed(1)}</Text>
                <Text style={styles.reviewCount}>
                  ({tasker.reviewCount} {t('booking.reviews')})
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Booking Summary */}
        <Card style={styles.card}>
          <CardContent style={styles.summaryContent}>
            <Text style={styles.sectionTitle}>{t('booking.summaryTitle')}</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('booking.date')}</Text>
              <Text style={styles.summaryValue}>{summary.date}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('booking.time')}</Text>
              <Text style={styles.summaryValue}>{summary.time}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('booking.budget')}</Text>
              <Text style={styles.budgetValue}>{summary.budget}</Text>
            </View>
          </CardContent>
        </Card>

        {/* Liability Disclaimer */}
        <View style={styles.disclaimerCard} testID="booking-confirmation-disclaimer">
          <View style={styles.disclaimerHeader}>
            <Shield size={20} color={colors.primaryDeep} />
            <Text style={styles.disclaimerTitle}>{t('booking.liabilityTitle')}</Text>
          </View>
          <Text style={styles.disclaimerText}>
            {t('booking.liabilityBody', t('booking.liabilityBody'))}
          </Text>
          <Pressable
            style={styles.checkboxRow}
            onPress={() => setTermsAccepted(!termsAccepted)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: termsAccepted }}
          >
            <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
              {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>{t('booking.acceptLiability')}</Text>
          </Pressable>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            onPress={onConfirm}
            disabled={!termsAccepted || isLoading}
            style={[styles.gradientWrapper, (!termsAccepted || isLoading) && styles.disabled]}
            testID="booking-confirmation-cta"
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDeep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.gradientButtonText}>
                {isLoading ? t('common.loading') : t('booking.confirmAction')}
              </Text>
            </LinearGradient>
          </Pressable>

          <Button
            label={t('common.cancel')}
            variant="ghost"
            onPress={onCancel}
            disabled={isLoading}
            style={styles.cancelButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  header: {
    marginBottom: spacing.xl,
  },
  headerLabel: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: colors.primaryDeep,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  taskTitle: {
    fontSize: typography.heading,
    fontWeight: '700',
    color: colors.foreground,
    letterSpacing: -0.5,
  },
  card: {
    marginBottom: spacing.lg,
  },
  taskerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.lg,
  },
  taskerDetails: {
    flex: 1,
  },
  taskerName: {
    fontSize: typography.subtitle,
    fontWeight: '600',
    color: colors.cardForeground,
    marginBottom: spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ratingText: {
    fontSize: typography.label,
    fontWeight: '600',
    color: colors.foreground,
  },
  reviewCount: {
    fontSize: typography.label,
    color: colors.mutedForeground,
  },
  summaryContent: {
    paddingVertical: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.cardForeground,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  summaryLabel: {
    fontSize: typography.label,
    color: colors.mutedForeground,
  },
  summaryValue: {
    fontSize: typography.label,
    fontWeight: '500',
    color: colors.foreground,
  },
  budgetValue: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  disclaimerCard: {
    backgroundColor: colors.muted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  disclaimerTitle: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.foreground,
  },
  disclaimerText: {
    fontSize: typography.caption,
    color: colors.mutedForeground,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.xs,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primaryDeep,
    borderColor: colors.primaryDeep,
  },
  checkmark: {
    color: colors.primaryForeground,
    fontSize: 14,
    fontWeight: '700',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: typography.label,
    color: colors.foreground,
  },
  actions: {
    gap: spacing.sm,
  },
  gradientWrapper: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: radius.md,
  },
  gradientButtonText: {
    color: colors.primaryForeground,
    fontSize: typography.body,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
  cancelButton: {
    alignSelf: 'center',
  },
});
