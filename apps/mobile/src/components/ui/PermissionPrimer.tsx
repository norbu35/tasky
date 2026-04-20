import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { elevations, overlays } from '../../design/elevations';
import { mobileTheme } from '../../design/tokenAdapter';
import { mobileSurfaces } from '../../design/surfaces';
import { cn } from '../../lib/cn';

import { Button } from './Button';
import { IllustrationArea, IconPreview } from './PermissionPrimer.Illustration';

const { colors, spacing, typography } = mobileTheme;
const { permissionPrimer } = mobileSurfaces;

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
    <View className={cn('flex-1 justify-end', className)} testID={testID}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.muted }]} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: overlays.sheet }]} />
      <IllustrationArea icon={icon} />
      <View
        className="bg-background rounded-tl-lg rounded-tr-lg px-xl pt-md pb-xl items-center"
        style={elevations.card}
      >
        <View
          className="rounded-full bg-border mb-lg"
          style={{
            width: permissionPrimer.sheetHandleWidth,
            height: permissionPrimer.sheetHandleHeight,
          }}
        />
        <IconPreview icon={icon} badgeLabel={badgeLabel} />
        <Text
          className="text-center mb-sm"
          style={{
            fontSize: permissionPrimer.titleSize,
            fontWeight: '800',
            color: colors.primaryDeep,
            letterSpacing: permissionPrimer.titleTracking,
          }}
        >
          {title}
        </Text>
        <Text
          className="text-body text-muted-foreground text-center mb-md"
          style={{ lineHeight: permissionPrimer.bodyLineHeight }}
        >
          {isDenied && deniedMessage ? deniedMessage : description}
        </Text>
        {isDenied && settingsHint ? (
          <Text
            className="text-center mb-xl"
            style={{
              fontSize: typography.label,
              color: colors.textSecondary,
              lineHeight: permissionPrimer.hintLineHeight,
            }}
          >
            {settingsHint}
          </Text>
        ) : null}
        <View className="self-stretch gap-sm">
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
            className="text-center"
            style={{
              marginTop: spacing.lg,
              fontSize: typography.caption,
              color: colors.textSecondary,
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
