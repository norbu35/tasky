import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Check, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ModalSheetTemplate } from '../../../components/templates/ModalSheetTemplate';
import { useCompleteBooking } from '../hooks/useCompleteBooking';
import { mobileTheme } from '../../../design/tokenAdapter';
import { elevations } from '../../../design/elevations';

const { colors, spacing, typography, radius } = mobileTheme;

interface ConfirmCompletionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  onCompleted?: () => void;
}

export function ConfirmCompletionSheet({
  isOpen,
  onClose,
  bookingId,
  onCompleted,
}: ConfirmCompletionSheetProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { mutateAsync: completeBooking, isPending } = useCompleteBooking();

  const handleConfirm = useCallback(async () => {
    const idempotencyKey = `complete-${bookingId}-${Date.now()}`;
    await completeBooking({ bookingId, idempotencyKey });
    onCompleted?.();
    router.replace({
      pathname: '/(shared)/review/[bookingId]',
      params: { bookingId, role: 'customer' },
    });
  }, [bookingId, completeBooking, onCompleted, router]);

  return (
    <ModalSheetTemplate
      isOpen={isOpen}
      onClose={onClose}
      testID="confirm-completion-sheet"
      snapPoints={['58%']}
    >
      <View style={styles.iconWrap}>
        <View style={styles.iconOuter}>
          <View style={styles.iconInner}>
            <Check size={30} color={colors.verified} strokeWidth={3} />
          </View>
        </View>
      </View>

      <Text style={styles.title}>
        {t('customer.bookings.confirmCompletionTitle', 'Ажил дууссан уу?')}
      </Text>

      <Text style={styles.description}>
        {t(
          'customer.bookings.confirmCompletionDescription',
          'Ажил хүлээн зөвшөөрснөөр гүйцэтгэгчид төлбөр олгогдоно',
        )}
      </Text>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => void handleConfirm()}
          style={styles.primaryWrap}
          testID="confirm-completion-confirm-btn"
          disabled={isPending}
        >
          <LinearGradient
            colors={[colors.verified, colors.trust]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.primaryButton, isPending && styles.buttonDisabled]}
          >
            <Text style={styles.primaryButtonText}>
              {t('customer.bookings.ctaConfirmComplete', 'Баталгаажуулах')}
            </Text>
            <ArrowRight size={18} color={colors.primaryForeground} />
          </LinearGradient>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={onClose}
          style={styles.secondaryButton}
          testID="confirm-completion-cancel-btn"
        >
          <Text style={styles.secondaryButtonText}>
            {t('customer.bookings.ctaGoBack', 'Буцах')}
          </Text>
        </Pressable>
      </View>
    </ModalSheetTemplate>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  iconOuter: {
    width: 80,
    height: 80,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevations.soft,
  },
  iconInner: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.trustMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: colors.primaryDeep,
    textAlign: 'center',
  },
  description: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.body * 1.6,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  actions: {
    gap: spacing.md,
  },
  primaryWrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  primaryButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primaryButtonText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.primaryForeground,
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.primaryDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
