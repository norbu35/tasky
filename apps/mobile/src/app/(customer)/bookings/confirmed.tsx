import React from 'react';
import {
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, CalendarPlus2, Check, ChevronLeft, MessageSquare } from 'lucide-react-native';
import { InsetScrollView, ScreenContainer } from '../../../components/shells';
import { Button } from '../../../components/ui/Button';
import { mobileTheme } from '../../../design/tokenAdapter';
import { elevations } from '../../../design/elevations';

const { colors, spacing, typography, radius } = mobileTheme;

const figmaTaskerAvatarUri =
  'https://www.figma.com/api/mcp/asset/e3050260-fefb-4ecc-82bc-e2a7ac3e17af';

export default function BookingConfirmedScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [canAddToCalendar, setCanAddToCalendar] = React.useState(false);
  const canAddToCalendarRef = React.useRef(canAddToCalendar);

  React.useEffect(() => {
    canAddToCalendarRef.current = canAddToCalendar;
  }, [canAddToCalendar]);

  React.useEffect(() => {
    let cancelled = false;
    const candidate = Platform.OS === 'ios' ? 'calshow:0' : 'content://com.android.calendar/time';

    void Linking.canOpenURL(candidate)
      .then((canOpen) => {
        if (!cancelled && canOpen !== canAddToCalendarRef.current) {
          canAddToCalendarRef.current = canOpen;
          setCanAddToCalendar(canOpen);
        }
      })
      .catch(() => {
        if (!cancelled && canAddToCalendarRef.current) {
          canAddToCalendarRef.current = false;
          setCanAddToCalendar(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleViewBooking = React.useCallback(() => {
    if (!bookingId) {
      router.replace('/(customer)/bookings');
      return;
    }
    router.replace(`/(customer)/bookings/${bookingId}`);
  }, [bookingId, router]);

  const handleDone = React.useCallback(() => {
    router.replace('/(customer)/bookings');
  }, [router]);

  const handleCalendar = React.useCallback(() => {
    const url = Platform.OS === 'ios' ? 'calshow:0' : 'content://com.android.calendar/time';
    void Linking.openURL(url).catch(() => {
      // Ignore platform-specific failures; the CTA is conditional.
    });
  }, []);

  return (
    <ScreenContainer testID="booking-confirmed-screen">
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            onPress={handleDone}
            style={styles.iconButton}
            testID="booking-confirmed-screen-close"
          >
            <ChevronLeft size={22} color={colors.primaryDeep} />
          </Pressable>
          <View style={styles.headerSpacer} />
        </View>

        <InsetScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          bounces={false}
          extraBottomInset={spacing.xl}
        >
          <View style={styles.successIconWrap}>
            <View style={styles.successIconBackground}>
              <Check size={36} color={colors.verified} strokeWidth={3} />
            </View>
          </View>

          <Text style={styles.headline}>
            {t('customer.bookings.confirmedHeadline', 'Захиалга баталгаажлаа!')}
          </Text>

          <Text style={styles.body}>
            {t(
              'customer.bookings.confirmedNextSteps',
              'Таны хүсэлтийг амжилттай хүлээн авлаа. Манай мэргэжилтэн тун удахгүй тантай холбогдох болно.',
            )}
          </Text>

          <View style={styles.sectionHeadingWrap}>
            <View style={styles.sectionHeadingPill}>
              <Text style={styles.sectionHeading}>
                {t('customer.bookings.nextStepsHeading', 'Дараагийн алхам')}
              </Text>
            </View>
          </View>

          <View style={styles.nextStepsCard}>
            <View style={styles.nextStepsIcon}>
              <CalendarPlus2 size={20} color={colors.primaryDeep} />
            </View>
            <View style={styles.nextStepsCopy}>
              <Text style={styles.nextStepsTitle}>
                {t('customer.bookings.nextStepsTitle', 'Товлосон цагтаа ирнэ')}
              </Text>
              <Text style={styles.nextStepsBody}>
                {t(
                  'customer.bookings.nextStepsBody',
                  'Таны сонгосон цагт гүйцэтгэгч заасан хаяг дээр очиж үйлчилгээг эхлүүлнэ. Түүнээс өмнө танд сануулах мессеж очно.',
                )}
              </Text>
            </View>
          </View>

          <View style={styles.providerCard}>
            <View style={styles.providerLeft}>
              <View style={styles.providerAvatarWrap}>
                <Image source={{ uri: figmaTaskerAvatarUri }} style={styles.providerAvatar} />
              </View>
              <View style={styles.providerCopy}>
                <Text style={styles.providerLabel}>
                  {t('customer.bookings.providerLabel', 'Гүйцэтгэгч')}
                </Text>
                <Text style={styles.providerName}>
                  {t('customer.bookings.providerName', 'Б. Тэмүүлэн')}
                </Text>
              </View>
            </View>
            <Pressable style={styles.messageButton} accessibilityRole="button">
              <MessageSquare size={18} color={colors.primaryDeep} />
            </Pressable>
          </View>

          {canAddToCalendar ? (
            <Pressable
              accessibilityRole="button"
              onPress={handleCalendar}
              style={styles.calendarCta}
              testID="booking-confirmed-screen-calendar"
            >
              <CalendarPlus2 size={18} color={colors.secondary} />
              <Text style={styles.calendarCtaText}>
                {t('customer.bookings.addToCalendar', 'Календарьт нэмэх')}
              </Text>
            </Pressable>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={handleViewBooking}
              style={styles.primaryButtonWrap}
              testID="booking-confirmed-screen-cta"
            >
              <LinearGradient
                colors={[colors.primaryDeep, colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>
                  {t('customer.bookings.ctaViewBooking', 'Захиалга харах')}
                </Text>
                <ArrowRight size={18} color={colors.primaryForeground} />
              </LinearGradient>
            </Pressable>

            <Button
              label={t('customer.bookings.ctaDone', 'Дууслаа')}
              variant="outline"
              onPress={handleDone}
              testID="booking-confirmed-screen-secondary-cta"
            />
          </View>
        </InsetScrollView>

        <View pointerEvents="none" style={styles.bottomAccent} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerSpacer: {
    flex: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['3xl'],
    alignItems: 'center',
    gap: spacing.lg,
  },
  successIconWrap: {
    paddingTop: spacing['2xl'],
  },
  successIconBackground: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    fontSize: typography.heading,
    lineHeight: typography.heading * 1.25,
    fontWeight: '700',
    color: colors.primaryDeep,
    textAlign: 'center',
    letterSpacing: -0.6,
    paddingHorizontal: spacing.md,
  },
  body: {
    fontSize: typography.body,
    lineHeight: typography.body * 1.6,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  sectionHeadingWrap: {
    alignSelf: 'stretch',
    marginTop: spacing.md,
  },
  sectionHeadingPill: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.muted,
    alignSelf: 'center',
  },
  sectionHeading: {
    fontSize: typography.label,
    fontWeight: '700',
    color: colors.secondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  nextStepsCard: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: spacing.lg,
    ...elevations.soft,
  },
  nextStepsIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  nextStepsCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  nextStepsTitle: {
    fontSize: typography.body,
    lineHeight: typography.body * 1.5,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  nextStepsBody: {
    fontSize: typography.label,
    lineHeight: typography.label * 1.6,
    color: colors.textSecondary,
  },
  providerCard: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    ...elevations.soft,
  },
  providerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  providerAvatarWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.muted,
  },
  providerAvatar: {
    alignSelf: 'stretch',
    height: '100%',
  },
  providerCopy: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  providerLabel: {
    fontSize: typography.micro,
    color: colors.textSecondary,
  },
  providerName: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarCta: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
  },
  calendarCtaText: {
    fontSize: typography.label,
    color: colors.secondary,
    fontWeight: '700',
  },
  actions: {
    alignSelf: 'stretch',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  primaryButtonWrap: {
    alignSelf: 'stretch',
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  primaryButton: {
    minHeight: 52,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  primaryButtonText: {
    fontSize: typography.body,
    color: colors.primaryForeground,
    fontWeight: '700',
  },
  bottomAccent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
    backgroundColor: colors.background,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    opacity: 0.7,
  },
});
