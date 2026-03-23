import React from 'react';
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { mobileTheme } from '../../design/tokenAdapter';
import { elevations } from '../../design/elevations';
import { Button } from '../ui/Button';
import { ErrorStateTemplate } from './ErrorStateTemplate';

const { colors, spacing, typography } = mobileTheme;

const HEADER_HEIGHT = 56;

export interface DetailTemplateProps {
    children: React.ReactNode;
    headerTitle?: string;
    onBack?: () => void;
    ctaLabel?: string;
    ctaOnPress?: () => void;
    ctaLoading?: boolean;
    ctaDisabled?: boolean;
    secondaryCtaLabel?: string;
    secondaryCtaOnPress?: () => void;
    rightAction?: { icon: React.ReactNode; onPress: () => void };
    isLoading?: boolean;
    isError?: boolean;
    onRetry?: () => void;
    errorMessage?: string;
    testID?: string;
}

function DetailSkeleton() {
    return (
        <View style={styles.skeletonContainer}>
            <View style={styles.skeletonBlockLarge} />
            <View style={styles.skeletonBlockMedium} />
            <View style={styles.skeletonBlockSmall} />
            <View style={styles.skeletonBlockMedium} />
        </View>
    );
}

export function DetailTemplate({
    children,
    headerTitle,
    onBack,
    ctaLabel,
    ctaOnPress,
    ctaLoading = false,
    ctaDisabled = false,
    secondaryCtaLabel,
    secondaryCtaOnPress,
    rightAction,
    isLoading = false,
    isError = false,
    onRetry,
    errorMessage,
    testID,
}: DetailTemplateProps) {
    const { t } = useTranslation();
    const hasBottomBar = !!(ctaLabel && ctaOnPress);

    return (
        <SafeAreaView style={styles.safeArea} testID={testID}>
            {/* Header */}
            <View style={styles.header}>
                {onBack ? (
                    <Pressable
                        onPress={onBack}
                        style={styles.headerAction}
                        hitSlop={spacing.sm}
                        testID={testID ? `${testID}-back` : undefined}
                    >
                        <ChevronLeft size={24} color={colors.primary} />
                    </Pressable>
                ) : (
                    <View style={styles.headerAction} />
                )}
                {headerTitle && (
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {headerTitle}
                    </Text>
                )}
                {rightAction ? (
                    <Pressable
                        onPress={rightAction.onPress}
                        style={styles.headerAction}
                        hitSlop={spacing.sm}
                        testID={testID ? `${testID}-right-action` : undefined}
                    >
                        {rightAction.icon}
                    </Pressable>
                ) : (
                    <View style={styles.headerAction} />
                )}
            </View>

            {/* Body */}
            {isError ? (
                <ErrorStateTemplate
                    message={errorMessage ?? t('detail.errorMessage', 'Could not load details')}
                    onRetry={onRetry}
                    testID={testID ? `${testID}-error` : undefined}
                />
            ) : isLoading ? (
                <DetailSkeleton />
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={[
                        styles.scrollContent,
                        hasBottomBar && styles.scrollContentWithCta,
                    ]}
                    showsVerticalScrollIndicator={false}
                >
                    {children}
                </ScrollView>
            )}

            {/* Sticky Bottom CTA */}
            {hasBottomBar && !isLoading && !isError && (
                <View style={styles.bottomBar}>
                    {secondaryCtaLabel && secondaryCtaOnPress && (
                        <Button
                            label={secondaryCtaLabel}
                            variant="outline"
                            onPress={secondaryCtaOnPress}
                            style={styles.secondaryCta}
                            testID={testID ? `${testID}-secondary-cta` : undefined}
                        />
                    )}
                    <Button
                        label={ctaLabel}
                        onPress={ctaOnPress}
                        isLoading={ctaLoading}
                        disabled={ctaDisabled}
                        style={styles.primaryCta}
                        testID={testID ? `${testID}-cta` : undefined}
                    />
                </View>
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
        height: HEADER_HEIGHT,
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
        paddingTop: spacing.xl,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl,
    },
    scrollContentWithCta: {
        paddingBottom: 120,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.card,
        padding: spacing.md,
        ...elevations.elevated,
    },
    primaryCta: {
        alignSelf: 'stretch',
    },
    secondaryCta: {
        alignSelf: 'stretch',
        marginBottom: spacing.sm,
    },
    skeletonContainer: {
        flex: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        gap: spacing.lg,
    },
    skeletonBlockLarge: {
        height: 200,
        backgroundColor: colors.muted,
        borderRadius: mobileTheme.radius.md,
    },
    skeletonBlockMedium: {
        height: spacing['3xl'],
        backgroundColor: colors.muted,
        borderRadius: mobileTheme.radius.md,
        width: '70%',
    },
    skeletonBlockSmall: {
        height: spacing.xl,
        backgroundColor: colors.muted,
        borderRadius: mobileTheme.radius.md,
        width: '45%',
    },
});
