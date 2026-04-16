import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { elevations, overlays } from '../../design/elevations';
import { mobileSurfaces, mobileTheme } from '../../design/tokenAdapter';
import { cn } from '../../lib/cn';

import { Button } from './Button';

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
      {/* Illustration area — fills upper ~60% with a prominent centred icon */}
      <View
        className="absolute left-0 right-0 top-0 bottom-[40%] items-center justify-center"
        pointerEvents="none"
      >
        <View
          className="rounded-full items-center justify-center"
          style={{
            width: permissionPrimer.topIllustrationSize,
            height: permissionPrimer.topIllustrationSize,
            backgroundColor: colors.card,
            ...elevations.elevated,
          }}
        >
          {icon}
        </View>
      </View>
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
        <View className="mt-sm mb-lg items-center">
          <View
            className="rounded-md items-center justify-center bg-muted"
            style={{
              width: permissionPrimer.iconPreviewSize,
              height: permissionPrimer.iconPreviewSize,
            }}
          >
            {icon}
          </View>
          <View
            className="absolute rounded-md items-center justify-center bg-accent border-background"
            style={[
              elevations.card,
              {
                top: permissionPrimer.badgeOffset,
                right: permissionPrimer.badgeOffset,
                width: permissionPrimer.badgeSize,
                height: permissionPrimer.badgeSize,
                borderWidth: permissionPrimer.badgeBorder,
              },
            ]}
          >
            <Text style={{ color: colors.primaryDeep, fontSize: 14, fontWeight: '700' }}>
              {badgeLabel}
            </Text>
          </View>
        </View>
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
