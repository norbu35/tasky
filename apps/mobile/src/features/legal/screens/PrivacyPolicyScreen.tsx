import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { DetailTemplate } from '@/components/templates/DetailTemplate';
import { mobileSurfaces } from '@/design/surfaces';

export default function PrivacyPolicyScreen() {
  const { t } = useTranslation();

  return (
    <DetailTemplate testID="SCR-TASK-018">
      <View className="mb-lg">
        <Text className="text-caption text-text-secondary text-left">
          {t('shared.legal.updated')}
        </Text>
      </View>

      <View className="mb-lg">
        <Text className="text-subtitle font-semibold text-primary-deep mb-sm text-left">
          {t('shared.legal.dataCollection')}
        </Text>
        <Text
          className="text-body text-text-secondary text-left"
          style={{ lineHeight: mobileSurfaces.paragraphLineHeight }}
        >
          {t('PrivacyPolicyScreen.copy1')}
        </Text>
      </View>

      <View className="mb-lg">
        <Text className="text-subtitle font-semibold text-primary-deep mb-sm text-left">
          {t('shared.legal.dataUsage')}
        </Text>
        <Text
          className="text-body text-text-secondary text-left"
          style={{ lineHeight: mobileSurfaces.paragraphLineHeight }}
        >
          {t('PrivacyPolicyScreen.copy2')}
        </Text>
      </View>

      <View className="mb-lg">
        <Text className="text-subtitle font-semibold text-primary-deep mb-sm text-left">
          {t('shared.legal.dataStorage')}
        </Text>
        <Text
          className="text-body text-text-secondary text-left"
          style={{ lineHeight: mobileSurfaces.paragraphLineHeight }}
        >
          {t('PrivacyPolicyScreen.copy3')}
        </Text>
      </View>

      <View className="mb-lg">
        <Text className="text-subtitle font-semibold text-primary-deep mb-sm text-left">
          {t('shared.legal.dataSharing')}
        </Text>
        <Text
          className="text-body text-text-secondary text-left"
          style={{ lineHeight: mobileSurfaces.paragraphLineHeight }}
        >
          {t('PrivacyPolicyScreen.copy4')}
        </Text>
      </View>

      <View className="mb-lg">
        <Text className="text-subtitle font-semibold text-primary-deep mb-sm text-left">
          {t('shared.legal.identityData')}
        </Text>
        <Text
          className="text-body text-text-secondary text-left"
          style={{ lineHeight: mobileSurfaces.paragraphLineHeight }}
        >
          {t('PrivacyPolicyScreen.copy5')}
        </Text>
      </View>

      <View className="mb-lg">
        <Text className="text-subtitle font-semibold text-primary-deep mb-sm text-left">
          {t('shared.legal.userRights')}
        </Text>
        <Text
          className="text-body text-text-secondary text-left"
          style={{ lineHeight: mobileSurfaces.paragraphLineHeight }}
        >
          {t('PrivacyPolicyScreen.copy6')}
        </Text>
      </View>

      <View className="mb-lg">
        <Text className="text-subtitle font-semibold text-primary-deep mb-sm text-left">
          {t('shared.legal.dataRetention')}
        </Text>
        <Text
          className="text-body text-text-secondary text-left"
          style={{ lineHeight: mobileSurfaces.paragraphLineHeight }}
        >
          {t('PrivacyPolicyScreen.copy7')}
        </Text>
      </View>

      <View className="mb-lg">
        <Text className="text-subtitle font-semibold text-primary-deep mb-sm text-left">
          {t('shared.legal.contact')}
        </Text>
        <Text
          className="text-body text-text-secondary text-left"
          style={{ lineHeight: mobileSurfaces.paragraphLineHeight }}
        >
          {t('PrivacyPolicyScreen.copy8')}
        </Text>
        <View className="mt-md bg-card rounded-md p-md gap-xs">
          <Text className="text-caption text-text-secondary text-left">
            {t('shared.legal.contactEmail')}
          </Text>
          <Text className="text-body font-semibold text-primary-deep text-left">
            support@tasky.mn
          </Text>
        </View>
      </View>
    </DetailTemplate>
  );
}
