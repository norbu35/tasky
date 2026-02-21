import React from 'react';
import { View, Text, StyleSheet, ViewProps, TextProps } from 'react-native';
import { mobileTheme } from '../../design/tokenAdapter';

const { colors } = mobileTheme;

export function Card({ style, ...props }: ViewProps) {
  return <View style={[styles.card, style]} {...props} />;
}

export function CardHeader({ style, ...props }: ViewProps) {
  return <View style={[styles.header, style]} {...props} />;
}

export function CardTitle({ style, ...props }: TextProps) {
  return <Text style={[styles.title, style]} {...props} />;
}

export function CardDescription({ style, ...props }: TextProps) {
  return <Text style={[styles.description, style]} {...props} />;
}

export function CardContent({ style, ...props }: ViewProps) {
  return <View style={[styles.content, style]} {...props} />;
}

export function CardFooter({ style, ...props }: ViewProps) {
  return <View style={[styles.footer, style]} {...props} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.cardForeground,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginTop: 4,
  },
  content: {
    padding: 16,
    paddingTop: 8,
  },
  footer: {
    padding: 16,
    paddingTop: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
