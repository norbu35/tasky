import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { nativeTokens } from '@tasky/design-tokens';

import { mobileSurfaces } from '@/design/surfaces';
import { mobileTheme } from '@/design/tokenAdapter';
import { cn } from '@/lib/cn';

import { Button } from './Button';
import { PermissionIllustration } from './PermissionPrimer.Illustration';

const { spacing } = mobileTheme;
const { permissionPrimer } = mobileSurfaces;
const colorOpacity = nativeTokens.colorOpacity;

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
  className?: string;
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
  allowLabel,
  skipLabel,
  badgeLabel = '✦',
  footerNote,
  className,
}: PermissionPrimerProps) {
  const { t } = useTranslation();
  const resolvedAllowLabel = allowLabel ?? t('common.allow');
  const resolvedSkipLabel = skipLabel ?? t('common.skip');
  const resolvedContinueLabel = continueLabel ?? t('common.continue');

  return (
    <View className={cn('flex-1 items-center justify-center', className)} testID={testID}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colorOpacity.primary[5] }]} />

      <View className="px-xl items-center" style={{ gap: spacing.md }}>
        <PermissionIllustration icon={icon} badgeLabel={badgeLabel} />

        <Text
          className="text-heading font-display-bold text-primary-deep text-center"
          style={{
            letterSpacing: permissionPrimer.titleTracking,
          }}
        >
          {title}
        </Text>

        <Text
          className="text-body text-muted-foreground text-center"
          style={{ lineHeight: permissionPrimer.bodyLineHeight }}
        >
          {isDenied && deniedMessage ? deniedMessage : description}
        </Text>

        {isDenied && settingsHint ? (
          <Text
            className="text-label text-text-secondary text-center"
            style={{
              lineHeight: permissionPrimer.hintLineHeight,
            }}
          >
            {settingsHint}
          </Text>
        ) : null}

        <View className="self-stretch" style={{ gap: spacing.sm }}>
          {isDenied ? (
            <Button
              testID="permission-continue-button"
              label={resolvedContinueLabel}
              variant="default"
              onPress={onContinue ?? onSkip}
              style={{ alignSelf: 'stretch', minHeight: permissionPrimer.buttonHeight }}
              accessibilityLabel={resolvedContinueLabel}
            />
          ) : (
            <>
              <Button
                testID="permission-allow-button"
                label={resolvedAllowLabel}
                variant="default"
                onPress={onGrant}
                style={{ alignSelf: 'stretch', minHeight: permissionPrimer.buttonHeight }}
                accessibilityLabel={resolvedAllowLabel}
              />
              <Button
                testID="permission-skip-button"
                label={resolvedSkipLabel}
                variant="ghost"
                onPress={onSkip}
                accessibilityLabel={resolvedSkipLabel}
              />
            </>
          )}
        </View>

        {footerNote ? (
          <Text
            className="text-caption text-text-secondary text-center"
            style={{
              marginTop: spacing.lg,
              lineHeight: permissionPrimer.footerLineHeight,
            }}
          >
            {footerNote}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
