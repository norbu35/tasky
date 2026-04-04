import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, CheckCircle, Star } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mobileTheme, elevations } from '../../../design/tokenAdapter';
import { Button } from '../../../components/ui/Button';
import { ProfileAvatar } from '../../../components/ui/ProfileAvatar';
import { useSubmitReview } from '../hooks/useSubmitReview';

const { colors, radius, spacing, typography } = mobileTheme;

const STAR_COUNT = 5;
const COMMENT_MAX_LENGTH = 500;
const STAR_SIZE = typography.body + spacing.lg / 2;

interface CategoryRating {
  key: string;
  labelKey: string;
  value: number;
}

type ReviewRole = 'customer' | 'tasker';

type ReviewParams = {
  bookingId?: string;
  role?: ReviewRole;
  name?: string;
  avatarUrl?: string;
};

const CUSTOMER_CATEGORIES: CategoryRating[] = [
  { key: 'qualityOfWork', labelKey: 'shared.review.qualityOfWork', value: 0 },
  { key: 'punctuality', labelKey: 'shared.review.punctuality', value: 0 },
  { key: 'communication', labelKey: 'shared.review.communication', value: 0 },
];

const TASKER_CATEGORIES: CategoryRating[] = [
  { key: 'taskDescriptionClarity', labelKey: 'shared.review.taskClarity', value: 0 },
  { key: 'respectfulness', labelKey: 'shared.review.respectfulness', value: 0 },
  { key: 'punctuality', labelKey: 'shared.review.punctuality', value: 0 },
];

function getCategoryLabel(role: ReviewRole, categoryKey: string) {
  if (role === 'tasker') {
    if (categoryKey === 'taskDescriptionClarity') return 'Ажлын тайлбарын тодорхой байдал';
    if (categoryKey === 'respectfulness') return 'Хүндэтгэл';
    if (categoryKey === 'punctuality') return 'Цаг баримтлал';
    return 'Үнэлгээ';
  }

  if (categoryKey === 'qualityOfWork') return 'Ажлын чанар';
  if (categoryKey === 'punctuality') return 'Цаг баримтлал';
  if (categoryKey === 'communication') return 'Харилцаа';
  return 'Үнэлгээ';
}

function createCategories(role: ReviewRole) {
  const base = role === 'tasker' ? TASKER_CATEGORIES : CUSTOMER_CATEGORIES;
  return base.map((category) => ({ ...category }));
}

function StarRatingInput({
  categoryKey,
  value,
  onChange,
}: {
  categoryKey: string;
  value: number;
  onChange: (rating: number) => void;
}) {
  return (
    <View style={styles.starsRow}>
      {Array.from({ length: STAR_COUNT }).map((_, i) => {
        const starIndex = i + 1;
        const isActive = starIndex <= value;
        return (
          <Pressable
            key={starIndex}
            testID={`rating-${categoryKey}-star-${starIndex}`}
            onPress={() => onChange(starIndex)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`${starIndex} star${starIndex > 1 ? 's' : ''}`}
            style={styles.starHit}
          >
            <Star
              size={STAR_SIZE}
              color={isActive ? colors.secondary : colors.chipInactive}
              fill={isActive ? colors.secondary : 'none'}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

export default function ReviewFormScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<ReviewParams>();

  const bookingId = params.bookingId ?? '';
  const role: ReviewRole = params.role === 'tasker' ? 'tasker' : 'customer';

  const [showSuccess, setShowSuccess] = useState(false);
  const successScale = useMemo(() => new Animated.Value(0.88), []);

  const [categories, setCategories] = useState<CategoryRating[]>(() => createCategories(role));
  const [comment, setComment] = useState('');
  const submitReview = useSubmitReview(() => {
    setShowSuccess(true);
  });

  const counterpartyName = params.name ?? (role === 'customer' ? 'Болд Б.' : 'Батбаяр Б.');
  const counterpartyRole = role === 'customer' ? 'Гүйцэтгэгч' : 'Захиалагч';
  const avatarUrl = params.avatarUrl ?? 'https://cdn.tasky.mn/avatars/counterparty.jpg';

  const allRated = categories.every((category) => category.value > 0);

  useEffect(() => {
    if (!showSuccess) return undefined;

    Animated.spring(successScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 7,
      tension: 70,
    }).start();

    const timeout = setTimeout(() => {
      router.back();
    }, 1500);

    return () => clearTimeout(timeout);
  }, [router, showSuccess, successScale]);

  const handleRatingChange = useCallback((key: string, rating: number) => {
    setCategories((prev) => prev.map((c) => (c.key === key ? { ...c, value: rating } : c)));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!allRated) return;

    const ratings: Record<string, number> = {};
    for (const c of categories) {
      ratings[c.key] = c.value;
    }

    submitReview.mutate({
      bookingId,
      ratings,
      comment: comment.trim(),
    });
  }, [allRated, bookingId, categories, comment, submitReview]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const submitLabel = t('shared.review.cta_submit', 'Илгээх');

  return (
    <SafeAreaView style={styles.safeArea} testID="review-form">
      <View style={styles.screen}>
        <View style={styles.header} testID="review-form-header">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.close', 'Close')}
            onPress={handleClose}
            style={styles.closeButton}
            testID="review-form-close"
          >
            <ArrowLeft size={22} color={colors.primaryDeep} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('shared.review.navTitle', 'Сэтгэгдэл бичих')}</Text>
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {showSuccess ? (
              <Animated.View
                style={[styles.successState, { transform: [{ scale: successScale }] }]}
                testID="review-success-state"
              >
                <View style={styles.successIcon}>
                  <CheckCircle size={34} color={colors.primary} fill={colors.verified} />
                </View>
                <Text style={styles.successTitle}>
                  {t('shared.review.successTitle', 'Баярлалаа!')}
                </Text>
                <Text style={styles.successBody}>
                  {t('shared.review.successBody', 'Таны сэтгэгдэл амжилттай бүртгэгдлээ')}
                </Text>
              </Animated.View>
            ) : (
              <>
                <View style={styles.counterpartyRow}>
                  <ProfileAvatar uri={avatarUrl} name={counterpartyName} size="lg" showVerified />
                  <View style={styles.counterpartyCopy}>
                    <Text style={styles.counterpartyName}>{counterpartyName}</Text>
                    <Text style={styles.counterpartyRole}>{counterpartyRole}</Text>
                  </View>
                </View>

                <View style={styles.categoriesSection}>
                  {categories.map((category) => (
                    <View key={category.key} style={styles.categoryRow}>
                      <View style={styles.categoryHeader}>
                        <Text style={styles.categoryLabel}>
                          {getCategoryLabel(role, category.key)}
                        </Text>
                        <Text style={styles.categoryValue}>
                          {category.value > 0 ? category.value.toFixed(1) : 'Хүлээгдэж буй'}
                        </Text>
                      </View>
                      <StarRatingInput
                        categoryKey={category.key}
                        value={category.value}
                        onChange={(rating) => handleRatingChange(category.key, rating)}
                      />
                    </View>
                  ))}
                </View>

                <View style={styles.commentSection}>
                  <Text style={styles.commentLabel}>
                    {t('shared.review.label_comment', 'Нэмэлт тайлбар (сонголтот)')}
                  </Text>
                  <View style={styles.commentCard}>
                    <TextInput
                      testID="review-comment-input"
                      style={styles.commentInput}
                      placeholder={t(
                        'shared.review.commentPlaceholder',
                        'Туршлагаасаа хуваалцана уу...',
                      )}
                      placeholderTextColor={colors.textTertiary}
                      multiline
                      textAlignVertical="top"
                      value={comment}
                      onChangeText={setComment}
                      maxLength={COMMENT_MAX_LENGTH}
                    />
                    <Text
                      style={styles.counter}
                    >{`${comment.length} / ${COMMENT_MAX_LENGTH}`}</Text>
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        {!showSuccess && submitReview.isError ? (
          <View style={styles.errorToast} testID="review-submit-error">
            <Text style={styles.errorText}>
              {t(
                'shared.review.errorSubmit',
                'Сэтгэгдэл илгээхэд алдаа гарлаа. Дахин оролдоно уу.',
              )}
            </Text>
            <Button
              label={t('common.retry', 'Дахин оролдох')}
              variant="ghost"
              onPress={handleSubmit}
              style={styles.errorAction}
              testID="review-submit-retry"
            />
          </View>
        ) : null}

        {!showSuccess ? (
          <View style={styles.footer} testID="review-form-footer">
            <BlurView
              intensity={80}
              tint="light"
              style={StyleSheet.absoluteFill}
              testID="review-form-footer-blur"
            />
            <View style={styles.footerOverlay}>
              <Button
                testID="review-form-next"
                onPress={handleSubmit}
                disabled={!allRated}
                isLoading={submitReview.isPending}
                style={styles.submitButton}
              >
                <Text style={styles.submitText}>{submitLabel}</Text>
                <ArrowRight size={16} color={colors.primaryForeground} />
              </Button>
            </View>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    minHeight: spacing['3xl'] + spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  closeButton: {
    width: spacing['3xl'],
    height: spacing['3xl'],
    borderRadius: spacing['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.primaryDeep,
    lineHeight: Math.round(typography.title * 1.4),
    letterSpacing: -0.5,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing['3xl'] * 2 + spacing.xl,
    gap: spacing['3xl'],
  },
  counterpartyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  counterpartyCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  counterpartyName: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  counterpartyRole: {
    alignSelf: 'flex-start',
    backgroundColor: colors.statusOpen,
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontWeight: '700',
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  categoriesSection: {
    gap: spacing.xl + spacing.sm,
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: spacing.xl,
  },
  categoryRow: {
    gap: spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  categoryLabel: {
    flex: 1,
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.primaryDeep,
    lineHeight: Math.round(typography.body * 1.6),
  },
  categoryValue: {
    fontSize: typography.label,
    fontWeight: '700',
    color: colors.secondary,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  starHit: {
    padding: 2,
  },
  commentSection: {
    gap: spacing.md,
  },
  commentLabel: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.primaryDeep,
    lineHeight: Math.round(typography.body * 1.6),
  },
  commentCard: {
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    minHeight: 168,
    padding: spacing.xl,
    paddingBottom: spacing.xl + spacing.md,
    position: 'relative',
  },
  commentInput: {
    flex: 1,
    minHeight: 100,
    fontSize: typography.body,
    lineHeight: Math.round(typography.body * 1.6),
    color: colors.primaryDeep,
    padding: 0,
    margin: 0,
  },
  counter: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.md,
    fontSize: typography.micro,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.textSecondary,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    backgroundColor: 'rgba(255,255,255,0.8)',
    ...elevations.navBar,
  },
  footerOverlay: {
    flex: 1,
  },
  submitButton: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  submitText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.primaryForeground,
  },
  successState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
    gap: spacing.md,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.muted,
  },
  successTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  successBody: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: Math.round(typography.body * 1.6),
    maxWidth: 320,
  },
  errorToast: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    bottom: spacing['3xl'] * 2 + spacing.xl,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
    ...elevations.card,
  },
  errorText: {
    fontSize: typography.body,
    color: colors.danger,
    lineHeight: Math.round(typography.body * 1.5),
  },
  errorAction: {
    alignSelf: 'flex-start',
    paddingHorizontal: 0,
  },
});
