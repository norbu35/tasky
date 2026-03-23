import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { mobileTheme } from '../../design/tokenAdapter';
import { Button } from '../ui/Button';

const { colors, spacing, typography } = mobileTheme;

export interface ErrorStateTemplateProps {
    message?: string;
    onRetry?: () => void;
    retryLabel?: string;
    onBack?: () => void;
    testID?: string;
}

export function ErrorStateTemplate({
    message,
    onRetry,
    retryLabel,
    onBack,
    testID,
}: ErrorStateTemplateProps) {
    const { t } = useTranslation();

    return (
        <View style={styles.container} testID={testID}>
            <AlertTriangle
                size={48}
                color={colors.danger}
            />
            <Text style={styles.message}>
                {message ?? t('error.generic', 'Something went wrong')}
            </Text>
            {onRetry && (
                <Button
                    label={retryLabel ?? t('error.retry', 'Try again')}
                    onPress={onRetry}
                    style={styles.retryButton}
                    testID={testID ? `${testID}-retry` : undefined}
                />
            )}
            {onBack && (
                <Button
                    label={t('error.goBack', 'Go back')}
                    variant="outline"
                    onPress={onBack}
                    style={styles.backButton}
                    testID={testID ? `${testID}-back` : undefined}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
    },
    message: {
        fontSize: typography.body,
        color: colors.primary,
        textAlign: 'center',
        marginTop: spacing.lg,
        lineHeight: typography.body * 1.6,
    },
    retryButton: {
        marginTop: spacing.xl,
        alignSelf: 'stretch',
    },
    backButton: {
        marginTop: spacing.md,
        alignSelf: 'stretch',
    },
});
