import React, { useState, useCallback } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { mobileTheme } from '../../../design/tokenAdapter';
import { ProfileAvatar } from '../../../components/ui';

const { colors, radius, spacing, typography } = mobileTheme;

const STAR_COLOR_ACTIVE = colors.accent;
const STAR_COUNT = 5;

type RevieweeRole = 'customer' | 'tasker';

interface ReviewFormProps {
    revieweeRole: RevieweeRole;
    revieweeName: string;
    revieweeAvatar?: string | null;
    bookingId: string;
    onSubmit?: (payload: ReviewPayload) => void;
    onSkip?: () => void;
}

interface CategoryRating {
    key: string;
    labelKey: string;
    value: number;
}

export interface ReviewPayload {
    bookingId: string;
    ratings: Record<string, number>;
    comment: string;
}

function getCategoriesForRole(role: RevieweeRole): CategoryRating[] {
    if (role === 'tasker') {
        // Customer reviewing a Tasker
        return [
            { key: 'qualityOfWork', labelKey: 'review.qualityOfWork', value: 0 },
            { key: 'punctuality', labelKey: 'review.punctuality', value: 0 },
            { key: 'communication', labelKey: 'review.communication', value: 0 },
        ];
    }
    // Tasker reviewing a Customer
    return [
        { key: 'taskDescriptionClarity', labelKey: 'review.taskDescriptionClarity', value: 0 },
        { key: 'respectfulness', labelKey: 'review.respectfulness', value: 0 },
        { key: 'punctuality', labelKey: 'review.punctuality', value: 0 },
    ];
}

function StarRatingInput({
    value,
    onChange,
}: {
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
                        onPress={() => onChange(starIndex)}
                        hitSlop={6}
                        style={styles.starHit}
                    >
                        <Star
                            size={28}
                            color={isActive ? STAR_COLOR_ACTIVE : colors.chipInactive}
                            fill={isActive ? STAR_COLOR_ACTIVE : 'none'}
                        />
                    </Pressable>
                );
            })}
        </View>
    );
}

export function ReviewForm({
    revieweeRole,
    revieweeName,
    revieweeAvatar,
    bookingId,
    onSubmit,
    onSkip,
}: ReviewFormProps) {
    const { t } = useTranslation();

    const [categories, setCategories] = useState<CategoryRating[]>(
        () => getCategoriesForRole(revieweeRole),
    );
    const [comment, setComment] = useState('');

    const allRated = categories.every((c) => c.value > 0);

    const handleRatingChange = useCallback((key: string, rating: number) => {
        setCategories((prev) =>
            prev.map((c) => (c.key === key ? { ...c, value: rating } : c)),
        );
    }, []);

    const handleSubmit = useCallback(() => {
        if (!allRated) return;

        const ratings: Record<string, number> = {};
        for (const c of categories) {
            ratings[c.key] = c.value;
        }

        onSubmit?.({ bookingId, ratings, comment: comment.trim() });
    }, [allRated, categories, comment, bookingId, onSubmit]);

    return (
        <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
        >
            {/* Header */}
            <Text style={styles.title}>{t('review.rateExperience')}</Text>

            {/* Reviewee identity */}
            <View style={styles.revieweeSection}>
                <ProfileAvatar uri={revieweeAvatar} name={revieweeName} size="lg" />
                <Text style={styles.revieweeName}>{revieweeName}</Text>
            </View>

            {/* Category ratings */}
            <View style={styles.categoriesCard}>
                {categories.map((category) => (
                    <View key={category.key} style={styles.categoryRow}>
                        <Text style={styles.categoryLabel}>{t(category.labelKey)}</Text>
                        <StarRatingInput
                            value={category.value}
                            onChange={(rating) => handleRatingChange(category.key, rating)}
                        />
                    </View>
                ))}
            </View>

            {/* Freetext comment */}
            <View style={styles.commentCard}>
                <TextInput
                    style={styles.commentInput}
                    placeholder={t('review.commentPlaceholder')}
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    textAlignVertical="top"
                    value={comment}
                    onChangeText={setComment}
                    maxLength={500}
                />
            </View>

            {/* Submit button (primary gradient) */}
            <Pressable
                onPress={handleSubmit}
                disabled={!allRated}
                style={({ pressed }) => [
                    styles.submitPressable,
                    !allRated && styles.submitDisabled,
                    pressed && allRated && styles.submitPressed,
                ]}
            >
                <LinearGradient
                    colors={[colors.primaryDeep, colors.primary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.submitGradient}
                >
                    <Text style={styles.submitText}>{t('review.submitReview')}</Text>
                </LinearGradient>
            </Pressable>

            {/* Skip link with mandatory note */}
            <View style={styles.skipSection}>
                <Pressable onPress={onSkip} hitSlop={8}>
                    <Text style={styles.skipText}>{t('review.skipForNow')}</Text>
                </Pressable>
                <Text style={styles.mandatoryNote}>{t('review.mandatoryNote')}</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scroll: {
        flex: 1,
        backgroundColor: colors.background,
    },
    container: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        paddingBottom: spacing.xl * 2,
        alignItems: 'center',
    },
    title: {
        fontSize: typography.title,
        fontWeight: '700',
        color: colors.foreground,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },

    // Reviewee
    revieweeSection: {
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.xl,
    },
    revieweeName: {
        fontSize: typography.body,
        fontWeight: '600',
        color: colors.foreground,
    },

    // Categories card
    categoriesCard: {
        width: '100%',
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        padding: spacing.lg,
        gap: spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    categoryRow: {
        gap: spacing.xs,
    },
    categoryLabel: {
        fontSize: typography.label,
        fontWeight: '600',
        color: colors.foreground,
    },
    starsRow: {
        flexDirection: 'row',
        gap: spacing.xs,
        marginTop: 4,
    },
    starHit: {
        padding: 2,
    },

    // Comment card
    commentCard: {
        width: '100%',
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        marginTop: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    commentInput: {
        minHeight: 100,
        padding: spacing.lg,
        fontSize: typography.body,
        color: colors.foreground,
        lineHeight: 22,
    },

    // Submit
    submitPressable: {
        width: '100%',
        marginTop: spacing.xl,
        borderRadius: radius.md,
        overflow: 'hidden',
    },
    submitGradient: {
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radius.md,
    },
    submitText: {
        fontSize: typography.body,
        fontWeight: '700',
        color: colors.primaryForeground,
        letterSpacing: 0.5,
    },
    submitDisabled: {
        opacity: 0.5,
    },
    submitPressed: {
        opacity: 0.9,
    },

    // Skip
    skipSection: {
        alignItems: 'center',
        marginTop: spacing.lg,
        gap: spacing.xs,
    },
    skipText: {
        fontSize: typography.label,
        fontWeight: '600',
        color: colors.primaryDeep,
    },
    mandatoryNote: {
        fontSize: typography.micro,
        color: colors.textTertiary,
        textAlign: 'center',
        paddingHorizontal: spacing.md,
        lineHeight: 16,
    },
});
