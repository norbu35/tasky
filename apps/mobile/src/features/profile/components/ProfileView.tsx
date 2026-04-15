import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { Button, FormField, Input } from '../../../components/ui';
import { LanguageSwitcher } from '../../../components/ui/LanguageSwitcher';
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

  if (isLoading) return <Text style={styles.loadingText}>{t('common.loading')}</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t('profile.title')}</Text>

      <FormField label={t('profile.fullName')}>
        <Input value={name} onChangeText={setName} />
      </FormField>

      <View style={styles.spacer} />

      <FormField label={t('profile.language')}>
        <LanguageSwitcher />
      </FormField>

      <View style={styles.spacer} />

      <Button
        label={t('profile.saveChanges')}
        onPress={() => updateMutation.mutate({ full_name: name })}
        isLoading={updateMutation.isPending}
      />
      <View style={styles.spacer} />
      <Button label={t('profile.signOut')} variant="secondary" onPress={signOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  spacer: {
    height: 20,
  },
  loadingText: {
    padding: 20,
  },
});
