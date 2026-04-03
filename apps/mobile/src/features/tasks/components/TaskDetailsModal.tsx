import React, { useState } from 'react';
import { Alert, Dimensions, Image, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { createMobileApiClient, PublicTask } from '../../../lib/mobileApiClient';
import { Button } from '../../../components/ui';
import { mobileTheme } from '../../../design/tokenAdapter';
import { useAuthStore } from '../../../store/authStore';
import { VerificationModal } from '../../verification/components/VerificationModal';
import { useRouter } from 'expo-router';

const { colors } = mobileTheme;
const { width } = Dimensions.get('window');

interface Props {
  task: PublicTask | null;
  visible: boolean;
  onClose: () => void;
}

export function TaskDetailsModal({ task, visible, onClose }: Props) {
  const { t } = useTranslation();
  const { profile, session } = useAuthStore();
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  if (!task) return null;

  const handleApply = async () => {
    if (!session || !profile) {
      onClose();
      router.push('/(auth)');
      return;
    }

    if (profile.role !== 'TASKER' && profile.role !== 'ADMIN') {
      Alert.alert(t('taskDetails.actionRequired'), t('taskDetails.onlyTaskers'));
      return;
    }

    if (profile.status === 'PENDING') {
      setIsVerifying(true);
      return;
    }

    setIsApplying(true);
    try {
      const client = createMobileApiClient();
      await client.applyToTask(session.accessToken, task.id, 'I am ready to help with this task!');
      Alert.alert(t('taskDetails.success'), t('taskDetails.applied'));
      onClose();
    } catch (err: any) {
      Alert.alert(t('taskDetails.failed'), err.message || t('common.error'));
    } finally {
      setIsApplying(false);
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
        <Text style={styles.headerTitle}>{t('taskDetails.title')}</Text>
      </View>
      <ScrollView style={styles.container}>
        <Text style={styles.category}>{task.category?.name_mn || task.category?.name}</Text>
        <Text style={styles.description}>{task.description}</Text>

        {task.photo_urls && task.photo_urls.length > 0 && (
          <View style={styles.carouselContainer}>
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
              {task.photo_urls.map((url, idx) => (
                <Image key={idx} source={{ uri: url }} style={styles.carouselImage} />
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.metaBox}>
          <Text style={styles.metaLabel}>{t('taskDetails.budget')}</Text>
          <Text style={styles.price}>{task.budget} MNT</Text>
        </View>

        <View style={styles.metaBox}>
          <Text style={styles.metaLabel}>{t('taskDetails.location')}</Text>
          <Text style={styles.metaValue}>{task.approximate_location}</Text>
        </View>

        <View style={styles.actions}>
          <Button label={t('taskDetails.applyNow')} onPress={handleApply} isLoading={isApplying} />
          <Button
            label={t('taskDetails.close')}
            variant="ghost"
            onPress={onClose}
            disabled={isApplying}
            style={{ marginTop: 8 }}
          />
        </View>
      </ScrollView>

      <VerificationModal
        visible={isVerifying}
        onClose={() => setIsVerifying(false)}
        onSuccess={() => {
          setIsVerifying(false);
          Alert.alert(t('taskDetails.reviewPending'), t('taskDetails.reviewPendingBody'));
        }}
      />
    </Modal>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.cardForeground,
    textAlign: 'center',
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  category: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: colors.foreground,
    lineHeight: 24,
    marginBottom: 24,
  },
  carouselContainer: {
    height: 250,
    marginBottom: 24,
    borderRadius: 8,
    overflow: 'hidden',
  },
  carouselImage: {
    width: width - 40, // 20 padding on each side
    height: 250,
    resizeMode: 'cover',
  },
  metaBox: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  metaLabel: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 14,
    color: colors.cardForeground,
    fontWeight: '500',
  },
  price: {
    fontSize: 18,
    color: colors.danger, // Or success color if available
    fontWeight: 'bold',
  },
  actions: {
    marginTop: 32,
    marginBottom: 60,
  },
});
