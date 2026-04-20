import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, Modal, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/ui';
import { mobileTheme } from '@/design/tokenAdapter';
import { useVerificationSubmit } from '../hooks/useVerificationSubmit';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type PhotoType = 'FRONT' | 'BACK' | 'SELFIE';

export function VerificationModal({ visible, onClose, onSuccess }: Props) {
  const { t } = useTranslation();
  const submitMutation = useVerificationSubmit();

  const [frontUri, setFrontUri] = useState<string | null>(null);
  const [backUri, setBackUri] = useState<string | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);

  const pickImage = async (type: PhotoType) => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(t('verification.permissionRequired'), t('verification.permissionMessage'));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      const uri = result.assets[0].uri;
      if (type === 'FRONT') setFrontUri(uri);
      if (type === 'BACK') setBackUri(uri);
      if (type === 'SELFIE') setSelfieUri(uri);
    }
  };

  const handleSubmit = () => {
    if (!frontUri || !backUri || !selfieUri) {
      Alert.alert(t('verification.missingPhotos'), t('verification.allPhotosRequired'));
      return;
    }

    submitMutation.mutate(
      { frontUri, backUri, selfieUri },
      {
        onSuccess: () => {
          Alert.alert(t('verification.success'), t('verification.uploadSuccess'));
          onSuccess();
        },
        onError: (err: Error) => {
          Alert.alert(t('verification.uploadFailed'), err.message || t('verification.uploadError'));
        },
      },
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="pt-[60] pb-[20] px-[20] bg-card border-b border-border">
        <Text className="text-[20] font-bold text-card-foreground text-center">
          {t('verification.title')}
        </Text>
      </View>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ padding: mobileTheme.spacing.xl }}
      >
        <Text className="text-[14] text-muted-foreground mb-[30] text-center leading-[20]">
          {t('verification.description')}
        </Text>

        <PhotoSection
          title={t('verification.frontId')}
          uri={frontUri}
          onPress={() => pickImage('FRONT')}
        />

        <PhotoSection
          title={t('verification.backId')}
          uri={backUri}
          onPress={() => pickImage('BACK')}
        />

        <PhotoSection
          title={t('verification.selfie')}
          uri={selfieUri}
          onPress={() => pickImage('SELFIE')}
        />

        <Button
          label={t('verification.submit')}
          onPress={handleSubmit}
          isLoading={submitMutation.isPending}
          style={{ marginTop: 12 }}
        />
        <Button
          label={t('common.cancel')}
          variant="ghost"
          onPress={onClose}
          disabled={submitMutation.isPending}
          style={{ marginTop: 8 }}
        />
      </ScrollView>
    </Modal>
  );
}

function PhotoSection({
  title,
  uri,
  onPress,
}: {
  title: string;
  uri: string | null;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View className="mb-[24] bg-card p-[16] rounded-[12]">
      <Text className="text-[16] font-semibold mb-[12] text-card-foreground">{title}</Text>
      {uri ? (
        <View>
          <Image source={{ uri }} className="self-stretch h-[200] rounded-[8] bg-muted mb-[12]" />
          <Button
            label={t('verification.retakePhoto')}
            variant="secondary"
            size="sm"
            onPress={onPress}
            style={{ alignSelf: 'center' }}
          />
        </View>
      ) : (
        <Button label={t('verification.takePhoto')} variant="outline" onPress={onPress} />
      )}
    </View>
  );
}
