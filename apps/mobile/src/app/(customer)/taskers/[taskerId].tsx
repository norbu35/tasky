import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Star } from 'lucide-react-native';
import { DetailTemplate } from '../../../components/templates/DetailTemplate';
import { ProfileAvatar } from '../../../components/ui';
import { mobileTheme } from '../../../design/tokenAdapter';
import { useTaskerProfile } from '../../../features/profile/hooks/useTaskerProfile';

const { colors, spacing, typography, radius } = mobileTheme;

export default function TaskerProfileScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const { taskerId } = useLocalSearchParams<{ taskerId: string }>();
    const { profile: profileQuery, reviews: reviewsQuery } = useTaskerProfile(taskerId);

    const profile = profileQuery.data;
    const reviews = reviewsQuery.data?.data ?? [];
    const isLoading = profileQuery.isLoading;
    const isError = profileQuery.isError;

    return (
        <DetailTemplate
            testID="tasker-profile-screen"
            headerTitle={t('customer.taskerProfile.title', 'Tasker Profile')}
            onBack={() => router.back()}
            isLoading={isLoading}
            isError={isError}
            onRetry={profileQuery.refetch}
            errorMessage={t('customer.taskerProfile.errorNetwork', 'Failed to load profile')}
        >
            {profile && (
                <View style={styles.content}>
                    {/* Profile Hero */}
                    <View style={styles.hero}>
                        <ProfileAvatar
                            uri={profile.avatar_url}
                            name={profile.full_name}
                            size="xl"
                            showVerified={(profile as any).is_pro}
                        />
                        <Text style={styles.name}>{profile.full_name}</Text>

                        {/* Rating */}
                        <View style={styles.ratingRow}>
                            <Star size={16} color={colors.accent} fill={colors.accent} />
                            <Text style={styles.ratingText}>
                                {((profile as any).rating_avg ?? 0).toFixed(1)}
                            </Text>
                        </View>

                        {/* Verified badge */}
                        {(profile as any).is_pro && (
                            <View style={styles.verifiedRow}>
                                <ShieldCheck size={16} color={colors.trustMuted} />
                                <Text style={styles.verifiedText}>
                                    {t('customer.taskerProfile.verified', 'Identity Verified')}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Stats */}
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>
                                {(profile as any).completed_tasks ?? 0}
                            </Text>
                            <Text style={styles.statLabel}>
                                {t('customer.taskerProfile.completedJobs', 'Jobs Completed')}
                            </Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>
                                {((profile as any).rating_avg ?? 0).toFixed(1)}
                            </Text>
                            <Text style={styles.statLabel}>
                                {t('customer.taskerProfile.rating', 'Rating')}
                            </Text>
                        </View>
                    </View>

                    {/* Reviews Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            {t('customer.taskerProfile.reviews', 'Reviews')}
                        </Text>

                        {reviews.length === 0 ? (
                            <Text style={styles.emptyReviews}>
                                {t('customer.taskerProfile.noReviews', 'No reviews yet')}
                            </Text>
                        ) : (
                            <View style={styles.reviewsList}>
                                {reviews.map((review: any) => (
                                    <View key={review.id} style={styles.reviewCard}>
                                        <View style={styles.reviewHeader}>
                                            <Text style={styles.reviewerName}>
                                                {review.reviewer?.full_name ?? ''}
                                            </Text>
                                            <View style={styles.reviewRating}>
                                                <Star
                                                    size={12}
                                                    color={colors.accent}
                                                    fill={colors.accent}
                                                />
                                                <Text style={styles.reviewRatingText}>
                                                    {review.quality_rating}
                                                </Text>
                                            </View>
                                        </View>
                                        {review.comment && (
                                            <Text style={styles.reviewComment}>
                                                {review.comment}
                                            </Text>
                                        )}
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                </View>
            )}
        </DetailTemplate>
    );
}

const styles = StyleSheet.create({
    content: {
        gap: spacing.xl,
    },
    hero: {
        alignItems: 'center',
        gap: spacing.sm,
    },
    name: {
        fontSize: typography.heroTitle,
        fontWeight: '800',
        color: colors.foreground,
        marginTop: spacing.sm,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    ratingText: {
        fontSize: typography.subtitle,
        fontWeight: '700',
        color: colors.foreground,
    },
    verifiedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: colors.trust,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: radius.full,
    },
    verifiedText: {
        fontSize: typography.label,
        fontWeight: '600',
        color: colors.trustMuted,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    statCard: {
        flex: 1,
        backgroundColor: colors.card,
        borderRadius: radius.md,
        padding: spacing.lg,
        alignItems: 'center',
        gap: spacing.xs,
    },
    statValue: {
        fontSize: typography.heroTitle,
        fontWeight: '800',
        color: colors.foreground,
    },
    statLabel: {
        fontSize: typography.caption,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    section: {
        gap: spacing.md,
    },
    sectionTitle: {
        fontSize: typography.title,
        fontWeight: '700',
        color: colors.foreground,
    },
    emptyReviews: {
        fontSize: typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        paddingVertical: spacing.xl,
    },
    reviewsList: {
        gap: spacing.md,
    },
    reviewCard: {
        backgroundColor: colors.card,
        borderRadius: radius.md,
        padding: spacing.lg,
        gap: spacing.sm,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    reviewerName: {
        fontSize: typography.label,
        fontWeight: '600',
        color: colors.foreground,
    },
    reviewRating: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    reviewRatingText: {
        fontSize: typography.label,
        fontWeight: '700',
        color: colors.foreground,
    },
    reviewComment: {
        fontSize: typography.body,
        color: colors.mutedForeground,
        lineHeight: typography.body * 1.5,
    },
});
