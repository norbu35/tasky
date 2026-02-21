import React, { useState } from 'react';
import { Modal, StyleSheet, Text, View, ScrollView, Alert, Image, Dimensions } from 'react-native';
import { PublicTask } from '../../../lib/mobileApiClient';
import { Button } from '../../../components/ui';
import { mobileTheme } from '../../../design/tokenAdapter';
import { useAuthStore } from '../../../store/authStore';
import { VerificationModal } from '../../verification/components/VerificationModal';
import { createMobileApiClient } from '../../../lib/mobileApiClient';

const { colors, typography, spacing } = mobileTheme;
const { width } = Dimensions.get('window');

interface Props {
  task: PublicTask | null;
  visible: boolean;
  onClose: () => void;
}

export function TaskDetailsModal({ task, visible, onClose }: Props) {
  const { profile, session } = useAuthStore();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  if (!task) return null;

  const handleApply = async () => {
    if (!profile || !session) return;

    if (profile.role !== 'TASKER' && profile.role !== 'ADMIN') {
      Alert.alert("Action Required", "Only Taskers can apply for tasks.");
      return;
    }

    if (profile.status === 'PENDING') {
      // Intercept and launch Verification Flow
      setIsVerifying(true);
      return;
    }

    // Proceed to apply
    setIsApplying(true);
    try {
      const client = createMobileApiClient();
      await client.applyToTask(session.accessToken, task.id, "I am ready to help with this task!");
      Alert.alert("Success", "You have successfully applied to this task.");
      onClose();
    } catch (err: any) {
      Alert.alert("Application Failed", err.message || "Could not apply.");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Task Details</Text>
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
          <Text style={styles.metaLabel}>Budget</Text>
          <Text style={styles.price}>{task.budget} MNT</Text>
        </View>

        <View style={styles.metaBox}>
          <Text style={styles.metaLabel}>Approximate Location</Text>
          <Text style={styles.metaValue}>{task.approximate_location}</Text>
        </View>

        <View style={styles.actions}>
          <Button
            label="Apply Now"
            onPress={handleApply}
            isLoading={isApplying}
          />
          <Button
            label="Close"
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
          // The backend now has their ID, they wait for admin approval
          Alert.alert("Review Pending", "You will be notified once an admin approves your profile. Then you can apply.");
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
    borderWidth: 1,
    borderColor: colors.border,
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
  }
});
