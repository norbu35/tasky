import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CheckSquare, Square } from 'lucide-react-native';
import { DetailTemplate } from '../../../components/templates/DetailTemplate';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

export default function ConsentScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);

  return (
    <DetailTemplate
      headerTitle={t('tasker.verification.consentTitle')}
      onBack={() => router.back()}
      ctaLabel={t('tasker.verification.consentAgree')}
      ctaOnPress={() => router.push('/(tasker)/verification/upload')}
      ctaDisabled={!agreed}
      testID="consent-screen"
    >
      <Text style={styles.heading}>{t('tasker.verification.consentTitle')}</Text>
      <Text style={styles.body}>{t('tasker.verification.consentBody')}</Text>

      <View style={styles.dataItems} testID="consent-data-items">
        <Text style={styles.dataItem}>{t('tasker.verification.uploadFront')}</Text>
        <Text style={styles.dataItem}>{t('tasker.verification.uploadBack')}</Text>
        <Text style={styles.dataItem}>{t('tasker.verification.uploadSelfie')}</Text>
      </View>

      <Pressable
        style={styles.checkboxRow}
        onPress={() => setAgreed((prev) => !prev)}
        testID="consent-checkbox"
      >
        {agreed ? (
          <CheckSquare size={24} color={colors.verified} />
        ) : (
          <Square size={24} color={colors.border} />
        )}
        <Text style={styles.checkboxLabel}>{t('tasker.verification.consentAgree')}</Text>
      </Pressable>
    </DetailTemplate>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: typography.heading,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  body: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: typography.body * 1.6,
    marginBottom: spacing.lg,
  },
  dataItems: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  dataItem: {
    fontSize: typography.body,
    color: colors.primary,
    lineHeight: typography.body * 1.6,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: typography.body,
    color: colors.primary,
    lineHeight: typography.body * 1.6,
  },
});
