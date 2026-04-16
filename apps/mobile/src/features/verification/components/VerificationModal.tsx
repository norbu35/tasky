import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../../components/ui';
import { mobileTheme } from '../../../design/tokenAdapter';
import { createMobileApiClient } from '../../../lib/mobileApiClient';
import { useAuthStore } from '../../../store/authStore';

const { colors } = mobileTheme;

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type PhotoType = 'FRONT' | 'BACK' | 'SELFIE';

export function VerificationModal({ visible, onClose, onSuccess }: Props) {
  const { t } = useTranslation();
  const { session } = useAuthStore();

  const [frontUri, setFrontUri] = useState<string | null>(null);
  const [backUri, setBackUri] = useState<string | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

  const uploadToPresignedUrl = async (uri: string, uploadUrl: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();

    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      body: blob,
      headers: {
        'Content-Type': 'image/jpeg',
      },
    });

    if (!uploadRes.ok) {
      throw new Error(`Upload failed to S3: ${uploadRes.statusText}`);
    }
  };

  const handleSubmit = async () => {
    if (!frontUri || !backUri || !selfieUri) {
      Alert.alert(t('verification.missingPhotos'), t('verification.allPhotosRequired'));
      return;
    }

    if (!session?.accessToken) return;

    setIsUploading(true);
    const client = createMobileApiClient();

    try {
      // 1. Get Presigned URLs
      const frontReq = await client.getVerificationUploadUrl(session.accessToken, {
        content_type: 'image/jpeg',
        document_side: 'FRONT',
      });
      const backReq = await client.getVerificationUploadUrl(session.accessToken, {
        content_type: 'image/jpeg',
        document_side: 'BACK',
      });
      const selfieReq = await client.getVerificationUploadUrl(session.accessToken, {
        content_type: 'image/jpeg',
        document_side: 'SELFIE',
      });

      // 2. Upload Blobs to S3
      await Promise.all([
        uploadToPresignedUrl(frontUri, frontReq.upload_url),
        uploadToPresignedUrl(backUri, backReq.upload_url),
        uploadToPresignedUrl(selfieUri, selfieReq.upload_url),
      ]);

      // 3. Submit Verification
      await client.submitVerification(session.accessToken, {
        id_card_front_key: frontReq.storage_key,
        id_card_back_key: backReq.storage_key,
        selfie_key: selfieReq.storage_key,
      });

      Alert.alert(t('verification.success'), t('verification.uploadSuccess'));
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      Alert.alert(t('verification.uploadFailed'), message || t('verification.uploadError'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{t('verification.title')}</Text>
      </View>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.description}>{t('verification.description')}</Text>

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
          isLoading={isUploading}
          style={styles.submitBtn}
        />
        <Button
          label={t('common.cancel')}
          variant="ghost"
          onPress={onClose}
          disabled={isUploading}
          style={styles.cancelBtn}
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
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {uri ? (
        <View>
          <Image source={{ uri }} style={styles.preview} />
          <Button
            label={t('verification.retakePhoto')}
            variant="secondary"
            size="sm"
            onPress={onPress}
            style={styles.retakeBtn}
          />
        </View>
      ) : (
        <Button label={t('verification.takePhoto')} variant="outline" onPress={onPress} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.cardForeground,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 24,
  },
  description: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: colors.cardForeground,
  },
  preview: {
    alignSelf: 'stretch',
    height: 200,
    borderRadius: 8,
    backgroundColor: colors.muted,
    marginBottom: 12,
  },
  retakeBtn: {
    alignSelf: 'center',
  },
  submitBtn: {
    marginTop: 12,
  },
  cancelBtn: {
    marginTop: 8,
  },
});
