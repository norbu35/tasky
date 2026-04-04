import React from 'react';
import { View, Text, StyleSheet, ViewProps, TextProps } from 'react-native';
import { mobileTheme } from '../../design/tokenAdapter';
import { elevations } from '../../design/elevations';

const { colors, radius, spacing, typography } = mobileTheme;

type CardViewProps = ViewProps & { className?: string };
type CardTextProps = TextProps & { className?: string };

export function Card({ style, className, ...props }: CardViewProps) {
  return <View style={[styles.card, style]} className={className} {...props} />;
}

export function CardHeader({ style, className, ...props }: CardViewProps) {
  return <View style={[styles.header, style]} className={className} {...props} />;
}

export function CardTitle({ style, className, ...props }: CardTextProps) {
  return <Text style={[styles.title, style]} className={className} {...props} />;
}

export function CardDescription({ style, className, ...props }: CardTextProps) {
  return <Text style={[styles.description, style]} className={className} {...props} />;
}

export function CardContent({ style, className, ...props }: CardViewProps) {
  return <View style={[styles.content, style]} className={className} {...props} />;
}

export function CardFooter({ style, className, ...props }: CardViewProps) {
  return <View style={[styles.footer, style]} className={className} {...props} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...elevations.card,
    overflow: 'hidden',
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.cardForeground,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: typography.body,
    color: colors.mutedForeground,
    marginTop: spacing.xs,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
  },
  footer: {
    padding: spacing.lg,
    paddingTop: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
