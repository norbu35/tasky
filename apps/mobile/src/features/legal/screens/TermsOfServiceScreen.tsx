import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { ScreenContainer } from '@/components/shells';
import { Button } from '@/components/ui/Button';
import { mobileTheme } from '@/design/tokenAdapter';

import {
  TermsContent,
  TermsErrorVisual,
  TermsLoading,
  resolveState,
  type ScreenState,
} from './terms.content';

const { colors, spacing } = mobileTheme;

export default function TermsOfServiceScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const paramsState = params['state'];
  const [state, setState] = useState<ScreenState>(() => resolveState(paramsState));

  useEffect(() => {
    setState(resolveState(paramsState));
  }, [paramsState]);

  return (
    <ScreenContainer testID="SCR-INFRA-004">
      {state === 'loading' ? (
        <TermsLoading />
      ) : state === 'error' ? (
        <View className="flex-1 px-lg pt-xl items-center">
          <TermsErrorVisual />
          <Text
            className="text-title font-sans-bold text-center mb-sm"
            style={{ color: colors.foreground }}
          >
            {t('infra.terms.errorHeadline')}
          </Text>
          <Text
            className="text-body text-center"
            style={{ color: colors.textSecondary, lineHeight: 26 }}
          >
            {t('infra.terms.errorDescription')}
          </Text>
          <Button
            label={t('infra.terms.errorRetry')}
            onPress={() => setState('loaded')}
            style={{ marginTop: spacing.xl, alignSelf: 'stretch' }}
          />
        </View>
      ) : (
        <TermsContent />
      )}
    </ScreenContainer>
  );
}
