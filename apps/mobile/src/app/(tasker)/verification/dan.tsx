import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AuthTemplate } from '../../../components/templates/AuthTemplate';
import { Button } from '../../../components/ui/Button';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

type DanState = 'default' | 'success';

export default function DanVerificationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ state?: DanState }>();
  const state = params.state === 'success' ? 'success' : 'default';

  if (state === 'success') {
    return (
      <AuthTemplate testID="dan-verification-screen">
        <View style={styles.content}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>DAN</Text>
          </View>
          <Text style={styles.title}>Баталгаажуулалт амжилттай!</Text>
          <Text style={styles.description}>
            Таны хаяг E-Mongolia-р баталгаажлаа. Одоо даалгавруудад анкет илгээх боломжтой.
          </Text>
          <Button label="Даалгавар хайх" onPress={() => router.push('/(tabs)')} />
        </View>
      </AuthTemplate>
    );
  }

  return (
    <AuthTemplate testID="dan-verification-screen">
      <View style={styles.content}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoBadgeText}>E-Mongolia</Text>
        </View>
        <Text style={styles.title}>Хурдан баталгаажуулалт</Text>
        <Text style={styles.description}>
          E-Mongolia (ДАН) системээр таниулах баталгаажуулалтыг автоматаар хийнэ. Зураг
          оруулах шаардлагагүй.
        </Text>
        <Button label="E-Mongolia-р баталгаажуулах" onPress={() => router.push('/(tasker)/verification/dan?state=success')} />
        <Button
          testID="dan-manual-fallback"
          label="Гар аргаар баталгаажуулах"
          variant="ghost"
          onPress={() => router.push('/(tasker)/verification/upload')}
        />
      </View>
    </AuthTemplate>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    alignItems: 'center',
    paddingTop: spacing['2xl'],
  },
  logoBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: '#e7eef6',
  },
  logoBadgeText: {
    color: colors.primaryDeep,
    fontSize: typography.label,
    fontWeight: '700',
  },
  title: {
    fontSize: typography.heading,
    fontWeight: '700',
    color: colors.primaryDeep,
    textAlign: 'center',
  },
  description: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
  },
});
