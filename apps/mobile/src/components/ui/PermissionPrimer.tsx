import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { mobileTheme } from '../../design/tokenAdapter';
import { elevations, overlays } from '../../design/elevations';
import { Button } from './Button';
import { cn } from '../../lib/cn';

const { colors, spacing, typography } = mobileTheme;

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
          className="w-32 h-32 rounded-full items-center justify-center"
          style={{
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
        <View className="w-10 h-[4px] rounded-full bg-border mb-lg" />
        <View className="mt-sm mb-lg items-center">
          <View className="w-24 h-24 rounded-md items-center justify-center bg-muted">{icon}</View>
          <View
            className="absolute -top-2 -right-2 w-8 h-8 rounded-md items-center justify-center bg-accent border-[4px] border-background"
            style={elevations.card}
          >
            <Text style={{ color: colors.primaryDeep, fontSize: 14, fontWeight: '700' }}>
              {badgeLabel}
            </Text>
          </View>
        </View>
        <Text
          className="text-center mb-sm"
          style={{
            fontSize: 24,
            fontWeight: '800',
            color: colors.primaryDeep,
            letterSpacing: -0.5,
          }}
        >
          {title}
        </Text>
        <Text
          className="text-body text-muted-foreground text-center mb-md"
          style={{ lineHeight: 24 }}
        >
          {isDenied && deniedMessage ? deniedMessage : description}
        </Text>
        {isDenied && settingsHint ? (
          <Text
            className="text-center mb-xl"
            style={{
              fontSize: typography.label,
              color: colors.textSecondary,
              lineHeight: 20,
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
              style={{ alignSelf: 'stretch', minHeight: 56 }}
              accessibilityLabel={resolvedContinueLabel}
            />
          ) : (
            <>
              <Button
                testID="permission-allow-button"
                label={resolvedAllowLabel}
                variant="default"
                onPress={onGrant}
                style={{ alignSelf: 'stretch', minHeight: 56 }}
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
              lineHeight: 18,
            }}
          >
            {footerNote}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
