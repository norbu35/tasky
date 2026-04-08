import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Camera } from 'lucide-react-native';
import { FormWizardTemplate } from '../../../components/templates/FormWizardTemplate';
import { FormField } from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import { ProfileAvatar } from '../../../components/ui/ProfileAvatar';
import { Touchable } from '../../../components/ui/Touchable';
import { useMyProfile, useUpdateProfile } from '../../../features/profile/hooks/useProfile';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors } = mobileTheme;

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: profile, isLoading } = useMyProfile();
  const updateMutation = useUpdateProfile();
  const profileDetails = profile as (typeof profile & { bio?: string | null }) | undefined;

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (profileDetails) {
      setName(profileDetails.full_name);
      setBio(profileDetails.bio ?? '');
    }
  }, [profileDetails]);

  const isDirty =
    !!profileDetails &&
    (name.trim() !== (profileDetails.full_name ?? '').trim() ||
      bio.trim() !== (profileDetails.bio ?? '').trim());

  const handleSave = () => {
    setNameError('');

    if (!name.trim()) {
      setNameError(t('shared.profile.nameRequired'));
      return;
    }

    updateMutation.mutate(
      { full_name: name.trim(), bio: bio.trim() },
      {
        onSuccess: () => {
          router.back();
        },
      },
    );
  };

  return (
    <FormWizardTemplate
      testID="SCR-SHARED-013"
      currentStep={0}
      totalSteps={1}
      onNext={handleSave}
      onBack={() => router.back()}
      nextLabel={t('shared.profile.save')}
      nextDisabled={isLoading || !isDirty}
      nextLoading={updateMutation.isPending}
      showBack={true}
    >
      {/* Avatar Section */}
      <View className="items-center gap-md py-lg bg-muted rounded-md px-lg">
        <ProfileAvatar uri={profile?.avatar_url} name={profile?.full_name} size="xl" />
        <Touchable testID="edit-profile-change-photo" className="flex-row items-center gap-xs">
          <Camera size={16} color={colors.primary} />
          <Text className="text-body text-primary font-medium">
            {t('shared.profile.changePhoto')}
          </Text>
        </Touchable>
      </View>

      {/* Name Field */}
      <FormField label={t('shared.profile.nameLabel')} errorText={nameError || undefined}>
        <Input
          value={name}
          onChangeText={(text) => {
            setName(text);
            if (nameError) setNameError('');
          }}
          placeholder={t('shared.profile.namePlaceholder')}
          maxLength={50}
        />
      </FormField>

      {/* Bio Field */}
      <FormField label={t('shared.profile.bioLabel')}>
        <Input
          value={bio}
          onChangeText={setBio}
          placeholder={t('shared.profile.bioPlaceholder')}
          maxLength={200}
          multiline
          numberOfLines={4}
          style={{ minHeight: 100, textAlignVertical: 'top' }}
        />
      </FormField>
    </FormWizardTemplate>
  );
}
