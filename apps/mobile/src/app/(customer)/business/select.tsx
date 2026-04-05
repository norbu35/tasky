import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../../components/shells';
import { ModalSheetTemplate } from '../../../components/templates/ModalSheetTemplate';
import { Button } from '../../../components/ui/Button';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

export default function SelectBusinessAccountScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  // TODO: wire real data — fetch business accounts for selection

  return (
    <ScreenContainer testID="SCR-B2B-005">
      <ModalSheetTemplate
        isOpen={isOpen}
        onClose={() => { setIsOpen(false); router.back(); }}
        title={t('b2b.select.title', 'Select Business Account')}
        testID="select-business-sheet"
      >
        <View style={styles.content}>
          <Text style={styles.empty}>
            {t('b2b.select.empty', 'No business accounts. Create one first.')}
          </Text>
          <Button
            label={t('b2b.dashboard.createAccount', 'Create Business Account')}
            onPress={() => {
              setIsOpen(false);
              router.push('/(customer)/business/new/details');
            }}
            style={styles.button}
          />
        </View>
      </ModalSheetTemplate>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  empty: { fontSize: typography.body, color: colors.mutedForeground, textAlign: 'center' },
  button: { alignSelf: 'stretch' },
});
