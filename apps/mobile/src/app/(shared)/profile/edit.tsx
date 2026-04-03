import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Camera } from 'lucide-react-native';
import { FormWizardTemplate } from '../../../components/templates/FormWizardTemplate';
import { FormField } from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import { ProfileAvatar } from '../../../components/ui/ProfileAvatar';
import { useMyProfile, useUpdateProfile } from '../../../features/profile/hooks/useProfile';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, typography, radius } = mobileTheme;

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
      setNameError(t('shared.profile.nameRequired', 'Нэр хоосон байж болохгүй'));
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
      currentStep={0}
      totalSteps={1}
      onNext={handleSave}
      onBack={() => router.back()}
      nextLabel={t('shared.profile.save', 'Хадгалах')}
      nextDisabled={isLoading || !isDirty}
      nextLoading={updateMutation.isPending}
      showBack={true}
      testID="edit-profile-screen"
    >
      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <ProfileAvatar uri={profile?.avatar_url} name={profile?.full_name} size="xl" />
        <Pressable style={styles.changePhotoButton}>
          <Camera size={16} color={colors.primary} />
          <Text style={styles.changePhotoText}>
            {t('shared.profile.changePhoto', 'Зураг солих')}
          </Text>
        </Pressable>
      </View>

      {/* Name Field */}
      <FormField label={t('shared.profile.nameLabel', 'Нэр')} errorText={nameError || undefined}>
        <Input
          value={name}
          onChangeText={(text) => {
            setName(text);
            if (nameError) setNameError('');
          }}
          placeholder={t('shared.profile.namePlaceholder', 'Нэрээ оруулна уу')}
          maxLength={50}
        />
      </FormField>

      {/* Bio Field */}
      <FormField label={t('shared.profile.bioLabel', 'Миний тухай')}>
        <Input
          value={bio}
          onChangeText={setBio}
          placeholder={t('shared.profile.bioPlaceholder', 'Өөрийнхөө тухай бичнэ үү')}
          maxLength={200}
          multiline
          numberOfLines={4}
          style={styles.bioInput}
        />
      </FormField>
    </FormWizardTemplate>
  );
}

const styles = StyleSheet.create({
  avatarSection: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  changePhotoText: {
    fontSize: typography.body,
    color: colors.primary,
    fontWeight: '500',
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
});
