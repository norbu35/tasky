import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { ScreenContainer } from '@/components/shells';
import { Button, FormField, Input } from '@/components/ui';
import { Card, CardContent } from '@/components/ui/Card';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { elevations } from '@/design/elevations';
import { screenLayout } from '@/design/screenLayout';
import { useMyProfile, useSignOut, useUpdateProfile } from '../hooks/useProfile';

export function ProfileView() {
  const { t } = useTranslation();
  const { data: profile, isLoading } = useMyProfile();
  const updateMutation = useUpdateProfile();
  const signOut = useSignOut();

  const [name, setName] = useState('');

  useEffect(() => {
    if (profile) setName(profile.full_name);
  }, [profile]);

  if (isLoading) {
    return (
      <ScreenContainer>
        <View className="px-screen-x pt-header-top">
          <Text className="text-body text-text-secondary">{t('common.loading')}</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View className="flex-1 px-screen-x pt-header-top gap-section">
        <ScreenHeader title={t('profile.title')} subtitle={t('profile.fullName')} />

        <Card style={elevations.soft}>
          <CardContent className="gap-block">
            <FormField label={t('profile.fullName')}>
              <Input value={name} onChangeText={setName} />
            </FormField>

            <FormField label={t('profile.language')}>
              <LanguageSwitcher />
            </FormField>
          </CardContent>
        </Card>

        <View style={{ gap: screenLayout.actions.buttonGap }}>
          <Button
            label={t('profile.saveChanges')}
            onPress={() => updateMutation.mutate({ full_name: name })}
            isLoading={updateMutation.isPending}
          />
          <Button label={t('profile.signOut')} variant="secondary" onPress={signOut} />
        </View>
      </View>
    </ScreenContainer>
  );
}
