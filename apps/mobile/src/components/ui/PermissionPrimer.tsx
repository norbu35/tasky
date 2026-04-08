import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
  allowLabel = 'Зөвшөөрөх',
  skipLabel = 'Дараа',
  badgeLabel = '✦',
  footerNote,
  className,
}: PermissionPrimerProps) {
  return (
    <View className={cn('flex-1 justify-end', className)} testID={testID}>
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.muted }]} />
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: overlays.sheet }]} />
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
              label={continueLabel ?? 'Үргэлжлүүлэх'}
              variant="default"
              onPress={onContinue ?? onSkip}
              style={{ alignSelf: 'stretch', minHeight: 56 }}
              accessibilityLabel={continueLabel ?? 'Үргэлжлүүлэх'}
            />
          ) : (
            <>
              <Button
                testID="permission-allow-button"
                label={allowLabel}
                variant="default"
                onPress={onGrant}
                style={{ alignSelf: 'stretch', minHeight: 56 }}
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
