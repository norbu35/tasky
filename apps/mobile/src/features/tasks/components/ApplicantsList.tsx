import React from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Star, Award, Inbox } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProfileAvatar } from '../../../components/ui';
import { mobileTheme } from '../../../design/tokenAdapter';
import { useTranslation } from 'react-i18next';
import { useApplications } from '../hooks/useApplications';
import { useAcceptApplication } from '../../bookings/hooks/useAcceptApplication';
import { generateIdempotencyKey } from '../../../utils/uuid';

const { colors, radius, typography } = mobileTheme;

// ---------- Types ----------

interface Applicant {
    id: string;
    name: string;
    avatarUrl?: string;
    rating: number;
    reviewCount: number;
    isVerified: boolean;
    isRecommended: boolean;
    categories: string[];
    bio: string;
}


// ---------- Sub-components ----------

function RecommendedBadge({ label }: { label: string }) {
    return (
        <View style={styles.recommendedBadge}>
            <Award size={12} color={colors.trustMuted} />
            <Text style={styles.recommendedText}>{label}</Text>
        </View>
    );
}

function CategoryTag({ label }: { label: string }) {
    return (
        <View style={styles.categoryTag}>
            <Text style={styles.categoryTagText}>{label}</Text>
        </View>
    );
}

function SectionSeparator({ label }: { label: string }) {
    return (
        <View style={styles.sectionSeparator}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorLabel}>{label}</Text>
            <View style={styles.separatorLine} />
        </View>
    );
}

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
    return (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
                <Inbox size={32} color={colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>{title}</Text>
            <Text style={styles.emptySubtitle}>{subtitle}</Text>
        </View>
    );
}

function ApplicantCard({
    applicant,
    onAccept,
    onViewProfile,
    acceptLabel,
    viewProfileLabel,
    reviewsLabel,
    recommendedLabel,
}: {
    applicant: Applicant;
    onAccept: (id: string) => void;
    onViewProfile: (id: string) => void;
    acceptLabel: string;
    viewProfileLabel: string;
    reviewsLabel: string;
    recommendedLabel: string;
}) {
    return (
        <View style={styles.card}>
            {/* Top row: avatar + info + recommended badge */}
            <View style={styles.cardTopRow}>
                <ProfileAvatar
                    uri={applicant.avatarUrl}
                    name={applicant.name}
                    size="md"
                    showVerified={applicant.isVerified}
                />
                <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{applicant.name}</Text>
                    <View style={styles.ratingRow}>
                        <Star size={12} color={colors.accent} fill={colors.accent} />
                        <Text style={styles.ratingValue}>{applicant.rating}</Text>
                        <Text style={styles.ratingCount}>
                            ({applicant.reviewCount} {reviewsLabel})
                        </Text>
                    </View>
                </View>
                {applicant.isRecommended && (
                    <RecommendedBadge label={recommendedLabel} />
                )}
            </View>

            {/* Category tags */}
            <View style={styles.tagsRow}>
                {applicant.categories.map((cat) => (
                    <CategoryTag key={cat} label={cat} />
                ))}
            </View>

            {/* Bio snippet */}
            <Text style={styles.bioSnippet} numberOfLines={2}>
                {applicant.bio}
            </Text>

            {/* Actions */}
            <View style={styles.cardActions}>
                <Pressable
                    style={styles.acceptButton}
                    onPress={() => onAccept(applicant.id)}
                >
                    <LinearGradient
                        colors={[colors.primaryDeep, colors.primary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.acceptGradient}
                    >
                        <Text style={styles.acceptText}>{acceptLabel}</Text>
                    </LinearGradient>
                </Pressable>
                <Pressable
                    style={styles.viewProfileButton}
                    onPress={() => onViewProfile(applicant.id)}
                >
                    <Text style={styles.viewProfileText}>{viewProfileLabel}</Text>
                </Pressable>
            </View>
        </View>
    );
}

// ---------- Main Component ----------

export function ApplicantsList() {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const { id: taskId } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { data, isLoading } = useApplications(taskId);
    const acceptApplication = useAcceptApplication();
    const applicants: Applicant[] = (data?.data ?? []).map((a: any) => ({
        id: a.id,
        name: a.tasker?.full_name ?? '',
        avatarUrl: a.tasker?.avatar_url,
        rating: a.tasker?.rating_avg ?? 0,
        reviewCount: a.tasker?.completed_tasks ?? 0,
        isVerified: a.tasker?.is_pro ?? false,
        isRecommended: a.recommended ?? false,
        categories: [],
        bio: a.message ?? '',
    }));
    const recommended = applicants.filter((a) => a.isRecommended);
    const others = applicants.filter((a) => !a.isRecommended);

    const handleAccept = async (applicationId: string) => {
        try {
            await acceptApplication.mutateAsync({
                taskId,
                applicationId,
                liabilityDisclaimerAccepted: true,
                idempotencyKey: generateIdempotencyKey(),
            });
            router.back();
        } catch {
            // error handled by Toast
        }
    };

    const handleViewProfile = (userId: string) => {
        router.push(`/profile/${userId}`);
    };

    // Build sectioned data for FlatList
    type ListItem =
        | { type: 'applicant'; data: Applicant }
        | { type: 'separator'; label: string };

    const listData: ListItem[] = [];

    if (recommended.length > 0) {
        for (const a of recommended) {
            listData.push({ type: 'applicant', data: a });
        }
        if (others.length > 0) {
            listData.push({
                type: 'separator',
                label: t('applicants.otherApplicants', 'Other Applicants'),
            });
        }
    }
    for (const a of others) {
        listData.push({ type: 'applicant', data: a });
    }

    const reviewsLabel = t('applicants.reviews', 'reviews');
    const recommendedLabel = t('applicants.recommended', 'Recommended');
    const acceptLabel = t('applicants.accept', 'ACCEPT');
    const viewProfileLabel = t('applicants.viewProfile', 'View Profile');

    const renderItem = ({ item }: { item: ListItem }) => {
        if (item.type === 'separator') {
            return <SectionSeparator label={item.label} />;
        }
        return (
            <ApplicantCard
                applicant={item.data}
                onAccept={handleAccept}
                onViewProfile={handleViewProfile}
                acceptLabel={acceptLabel}
                viewProfileLabel={viewProfileLabel}
                reviewsLabel={reviewsLabel}
                recommendedLabel={recommendedLabel}
            />
        );
    };

    const keyExtractor = (item: ListItem, index: number) =>
        item.type === 'applicant' ? item.data.id : `sep-${index}`;

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.headerButton}>
                    <ChevronLeft size={16} color={colors.foreground} />
                </Pressable>
                <Text style={styles.headerTitle}>
                    {t('applicants.title', 'Applicants')} ({applicants.length})
                </Text>
                <View style={styles.headerButton} />
            </View>

            {/* Content */}
            {isLoading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={colors.primaryDeep} />
                </View>
            ) : applicants.length === 0 ? (
                <EmptyState
                    title={t('applicants.emptyTitle', 'No applicants yet')}
                    subtitle={t(
                        'applicants.emptySubtitle',
                        'Once taskers apply to your task, they will appear here.',
                    )}
                />
            ) : (
                <FlatList
                    data={listData}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

// ---------- Styles ----------

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
        paddingHorizontal: 24,
        backgroundColor: 'rgba(249,249,249,0.7)',
    },
    headerButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        flex: 1,
        fontSize: typography.title,
        fontWeight: '700',
        color: colors.foreground,
        textAlign: 'center',
        letterSpacing: -0.5,
    },

    // List
    listContent: {
        paddingHorizontal: 24,
        paddingBottom: 128,
        gap: 16,
        paddingTop: 16,
    },

    // Card
    card: {
        backgroundColor: colors.card,
        borderRadius: radius.md,
        padding: 20,
        gap: 14,
    },
    cardTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    cardInfo: {
        flex: 1,
        gap: 2,
    },
    cardName: {
        fontSize: typography.subtitle,
        fontWeight: '700',
        color: colors.foreground,
    },

    // Rating
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    ratingValue: {
        fontSize: typography.label,
        fontWeight: '700',
        color: colors.foreground,
    },
    ratingCount: {
        fontSize: typography.caption,
        color: colors.textSecondary,
    },

    // Recommended badge
    recommendedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.trust,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    recommendedText: {
        fontSize: typography.micro,
        fontWeight: '700',
        color: colors.accentForeground,
        letterSpacing: -0.5,
        textTransform: 'uppercase',
    },

    // Category tags
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryTag: {
        backgroundColor: colors.chipInactive,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: radius.full,
    },
    categoryTagText: {
        fontSize: typography.caption,
        fontWeight: '600',
        color: colors.mutedForeground,
    },

    // Bio
    bioSnippet: {
        fontSize: typography.label,
        color: colors.mutedForeground,
        lineHeight: 22,
    },

    // Card actions
    cardActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingTop: 2,
    },
    acceptButton: {
        flex: 1,
        borderRadius: radius.md,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    acceptGradient: {
        paddingVertical: 14,
        alignItems: 'center',
        borderRadius: radius.md,
    },
    acceptText: {
        fontSize: typography.label,
        fontWeight: '700',
        color: colors.primaryForeground,
        letterSpacing: 0.5,
    },
    viewProfileButton: {
        paddingVertical: 14,
        paddingHorizontal: 4,
        alignItems: 'center',
    },
    viewProfileText: {
        fontSize: typography.label,
        fontWeight: '700',
        color: colors.primaryDeep,
    },

    // Section separator
    sectionSeparator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 8,
    },
    separatorLine: {
        flex: 1,
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.border,
    },
    separatorLabel: {
        fontSize: typography.caption,
        fontWeight: '600',
        color: colors.textSecondary,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },

    // Empty state
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 48,
        gap: 12,
    },
    emptyIconCircle: {
        width: 72,
        height: 72,
        borderRadius: radius.full,
        backgroundColor: colors.muted,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    emptyTitle: {
        fontSize: typography.subtitle,
        fontWeight: '700',
        color: colors.foreground,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: typography.label,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
});
