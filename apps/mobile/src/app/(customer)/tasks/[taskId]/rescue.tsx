import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Lightbulb } from 'lucide-react-native';
import { DetailTemplate } from '../../../../components/templates/DetailTemplate';
import { Button } from '../../../../components/ui/Button';
import { mobileTheme } from '../../../../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

export default function NoApplicantRescueScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  // TODO: wire real data — fetch task details, provide rescue actions

  return (
    <DetailTemplate testID="SCR-CUST-026">
      <View style={styles.content}>
        <Lightbulb size={48} color={colors.secondary} />
        <Text style={styles.headline}>
          {t('customer.rescue.headline', 'No applicants yet')}
        </Text>
        <Text style={styles.body}>
          {t('customer.rescue.body', 'Try adjusting your budget or schedule to attract more taskers.')}
        </Text>
        <Button
          label={t('customer.rescue.adjustTask', 'Adjust Task')}
          onPress={() => router.back()}
          style={styles.cta}
        />
        <Button
          label={t('customer.rescue.contactSupport', 'Contact Concierge')}
          variant="outline"
          onPress={() => {
            // TODO: wire concierge support
          }}
          style={styles.cta}
        />
      </View>
    </DetailTemplate>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  headline: {
    fontSize: typography.heading,
    fontWeight: '600',
    color: colors.primaryDeep,
    textAlign: 'center',
  },
  body: {
    fontSize: typography.body,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: typography.body * 1.6,
  },
  cta: {
    alignSelf: 'stretch',
  },
});
