import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Check, ArrowRight } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { ModalSheetTemplate } from '@/components/templates/ModalSheetTemplate';
import { elevations } from '@/design/elevations';
import { mobileTheme } from '@/design/tokenAdapter';
import { mobileSurfaces } from '@/design/surfaces';
import { useCompleteBooking } from '../hooks/useCompleteBooking';

const { colors, typography } = mobileTheme;

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
      <View className="items-center mt-sm mb-md">
        <View
          className="w-[80] h-[80] rounded-lg bg-card items-center justify-center"
          style={{ ...elevations.soft }}
        >
          <View className="w-[56] h-[56] rounded-lg bg-trust-muted items-center justify-center">
            <Check size={24} color={colors.verified} strokeWidth={3} />
          </View>
        </View>
      </View>

      <Text className="text-subtitle font-bold text-primary-deep text-center">
        {t('customer.bookings.confirmCompletionTitle')}
      </Text>

      <Text
        className="text-body text-text-secondary text-center mt-sm mb-lg"
        style={{ lineHeight: typography.body * 1.6 }}
      >
        {t('ConfirmCompletionSheet.copy1')}
      </Text>

      <View className="gap-md">
        <Pressable
          accessibilityRole="button"
          onPress={() => void handleConfirm()}
          className="rounded-md overflow-hidden"
          testID="confirm-completion-confirm-btn"
          disabled={isPending}
        >
          <LinearGradient
            colors={[colors.verified, colors.trust]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className={`min-h-[52] flex-row items-center justify-center gap-sm${isPending ? ' opacity-70' : ''}`}
          >
            <Text className="text-body font-bold text-primary-foreground">
              {t('ConfirmCompletionSheet.confirmLabel')}
            </Text>
            <ArrowRight size={20} color={colors.primaryForeground} />
          </LinearGradient>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={onClose}
          className="rounded-md border-2 border-primary-deep items-center justify-center"
          style={{ minHeight: mobileSurfaces.touchTarget.ctaHeight }}
          testID="confirm-completion-cancel-btn"
        >
          <Text className="text-body font-bold text-primary-deep">
            {t('customer.bookings.ctaGoBack')}
          </Text>
        </Pressable>
      </View>
    </ModalSheetTemplate>
  );
}
