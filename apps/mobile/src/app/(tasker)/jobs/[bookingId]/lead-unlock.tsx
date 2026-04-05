import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Unlock } from 'lucide-react-native';
import { DetailTemplate } from '../../../../components/templates/DetailTemplate';
import { Button } from '../../../../components/ui/Button';
import { mobileTheme } from '../../../../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

export default function LeadUnlockScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  // TODO: wire real data — fetch lead details, credit balance, accept/decline handlers

  return (
    <DetailTemplate testID="SCR-TASK-017">
      <View style={styles.content}>
        <Unlock size={48} color={colors.primary} />
        <Text style={styles.headline}>
          {t('tasker.leadUnlock.headline', 'Lead Unlock Request')}
        </Text>
        <Text style={styles.body}>
          {t('tasker.leadUnlock.body', 'A customer has selected you. Accept to unlock the lead using credits, or decline.')}
        </Text>
        <Button
          label={t('tasker.leadUnlock.accept', 'Accept & Unlock')}
          onPress={() => {
            // TODO: wire accept + credit deduction
            router.back();
          }}
          style={styles.button}
        />
        <Button
          label={t('tasker.leadUnlock.decline', 'Decline')}
          variant="outline"
          onPress={() => router.back()}
          style={styles.button}
        />
      </View>
    </DetailTemplate>
  );
}

const styles = StyleSheet.create({
  content: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.lg },
  headline: { fontSize: typography.heading, fontWeight: '600', color: colors.primaryDeep, textAlign: 'center' },
  body: { fontSize: typography.body, color: colors.mutedForeground, textAlign: 'center', lineHeight: typography.body * 1.6 },
  button: { alignSelf: 'stretch' },
});
