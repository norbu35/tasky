import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Camera } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Text, View } from 'react-native';

import { FormWizardTemplate } from '@/components/templates/FormWizardTemplate';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { Touchable } from '@/components/ui/Touchable';
import { mobileTheme } from '@/design/tokenAdapter';
import { getAvatarUploadUrl } from '@/features/profile/api';
import { useMyProfile, useUpdateProfile } from '@/features/profile/hooks/useProfile';
import { useAuthStore } from '@/store/authStore';

const { colors } = mobileTheme;

export default function ProfileEditScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const { data: profile, isLoading } = useMyProfile();
  const updateMutation = useUpdateProfile();
  const profileDetails = profile as (typeof profile & { bio?: string | null }) | undefined;

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [nameError, setNameError] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

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

  const handleChangePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('Photos.permissionTitle'), t('Photos.permissionBody'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || result.assets.length === 0) return;
    const uri = result.assets[0].uri;
    setIsUploadingAvatar(true);
    try {
      const { uploadUrl, storageKey } = await getAvatarUploadUrl(
        session?.accessToken ?? '',
        'image/jpeg',
      );
      const blobResponse = await fetch(uri);
      const blob = await blobResponse.blob();
      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'image/jpeg' },
        body: blob,
      });
      updateMutation.mutate({ avatar_url: storageKey });
    } catch {
      Alert.alert(t('common.error'), t('shared.profile.uploadError'));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

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
      title={t('shared.profile.editTitle')}
      currentStep={0}
      totalSteps={1}
      onNext={handleSave}
      onBack={() => router.back()}
      nextLabel={t('shared.profile.save')}
      nextDisabled={isLoading || !isDirty || isUploadingAvatar}
      nextLoading={updateMutation.isPending}
      showBack={true}
    >
      {/* Avatar Section */}
      <View className="items-center gap-md py-lg bg-muted rounded-md px-lg">
        <ProfileAvatar uri={profile?.avatar_url} name={profile?.full_name} size="xl" />
        <Touchable
          testID="edit-profile-change-photo"
          className="flex-row items-center gap-xs"
          onPress={() => {
            void handleChangePhoto();
          }}
          disabled={isUploadingAvatar}
        >
          {isUploadingAvatar ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Camera size={16} color={colors.primary} />
          )}
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
