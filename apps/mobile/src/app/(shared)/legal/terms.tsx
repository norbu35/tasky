import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { DetailTemplate } from '../../../components/templates/DetailTemplate';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

export default function TermsScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <DetailTemplate
      headerTitle={t('infra.terms.title', 'Terms of Service')}
      onBack={() => router.back()}
      testID="terms-screen"
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('infra.terms.section1Title', '1. Acceptance of Terms')}
        </Text>
        <Text style={styles.sectionBody}>
          {t(
            'infra.terms.section1Body',
            'By accessing or using the Tasky application, you agree to be bound by these Terms of Service and all applicable laws and regulations.',
          )}
        </Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('infra.terms.section2Title', '2. Use of Service')}
        </Text>
        <Text style={styles.sectionBody}>
          {t(
            'infra.terms.section2Body',
            'Tasky provides a platform connecting customers with service providers. You agree to use the service only for lawful purposes.',
          )}
        </Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('infra.terms.section3Title', '3. User Accounts')}
        </Text>
        <Text style={styles.sectionBody}>
          {t(
            'infra.terms.section3Body',
            'You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.',
          )}
        </Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('infra.terms.section4Title', '4. Liability')}</Text>
        <Text style={styles.sectionBody}>
          {t(
            'infra.terms.section4Body',
            'Tasky acts solely as a connector between task posters and taskers. Tasky does not process payments, employ taskers, or guarantee work quality.',
          )}
        </Text>
      </View>
    </DetailTemplate>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.subtitle,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  sectionBody: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: typography.body * 1.6,
  },
});
