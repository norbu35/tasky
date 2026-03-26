import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { mobileTheme } from '../../design/tokenAdapter';
import { elevations } from '../../design/elevations';
import { Button } from './Button';

const { colors, radius, spacing, typography } = mobileTheme;

interface PermissionPrimerProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onGrant: () => void;
  onSkip: () => void;
  testID?: string;
  deniedMessage?: string;
  settingsHint?: string;
  continueLabel?: string;
  onContinue?: () => void;
  isDenied?: boolean;
  allowLabel?: string;
  skipLabel?: string;
  badgeLabel?: string;
  footerNote?: string;
}

export function PermissionPrimer({
  icon,
  title,
  description,
  onGrant,
  onSkip,
  testID,
  deniedMessage,
  settingsHint,
  continueLabel,
  onContinue,
  isDenied = false,
  allowLabel = 'Зөвшөөрөх',
  skipLabel = 'Дараа',
  badgeLabel = '✦',
  footerNote,
}: PermissionPrimerProps) {
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.mockBackdrop} />
      <View style={styles.scrim} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.iconShell}>
          <View style={styles.iconContainer}>{icon}</View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeLabel}</Text>
          </View>
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>
          {isDenied && deniedMessage ? deniedMessage : description}
        </Text>
        {isDenied && settingsHint ? <Text style={styles.settingsHint}>{settingsHint}</Text> : null}
        <View style={styles.actions}>
          {isDenied ? (
            <Button
              testID="permission-continue-button"
              label={continueLabel ?? 'Үргэлжлүүлэх'}
              variant="default"
              onPress={onContinue ?? onSkip}
              style={styles.grantButton}
              accessibilityLabel={continueLabel ?? 'Үргэлжлүүлэх'}
            />
          ) : (
            <>
              <Button
                testID="permission-allow-button"
                label={allowLabel}
                variant="default"
                onPress={onGrant}
                style={styles.grantButton}
                accessibilityLabel={allowLabel}
              />
              <Button
                testID="permission-skip-button"
                label={skipLabel}
                variant="ghost"
                onPress={onSkip}
                accessibilityLabel={skipLabel}
              />
            </>
          )}
        </View>
        {footerNote ? <Text style={styles.footerNote}>{footerNote}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  mockBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F4F3F0',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30, 52, 71, 0.28)',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    alignItems: 'center',
    ...elevations.card,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 12,
    backgroundColor: '#D7D5D1',
    marginBottom: spacing.lg,
  },
  iconShell: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9E8E5',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDCE6A',
    borderWidth: 4,
    borderColor: colors.background,
    ...elevations.card,
  },
  badgeText: {
    color: '#1B3A5C',
    fontSize: 14,
    fontWeight: '700',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primaryDeep,
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: typography.body,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  settingsHint: {
    fontSize: typography.label,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  actions: {
    width: '100%',
    gap: spacing.sm,
  },
  grantButton: {
    width: '100%',
    minHeight: 52,
    borderRadius: 8,
  },
  footerNote: {
    marginTop: spacing.lg,
    fontSize: typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
