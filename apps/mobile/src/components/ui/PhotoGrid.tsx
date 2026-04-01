import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { mobileTheme } from '../../design/tokenAdapter';

const { colors, radius, spacing, typography } = mobileTheme;

interface PhotoGridProps {
  photos: string[];
  maxPhotos?: number;
  onAddPhoto?: () => void;
  showAddButton?: boolean;
  testID?: string;
}

export function PhotoGrid({
  photos,
  maxPhotos = 4,
  onAddPhoto,
  showAddButton = false,
  testID,
}: PhotoGridProps) {
  const { t } = useTranslation();
  const visiblePhotos = photos.slice(0, maxPhotos);
  const remainingCount = photos.length - maxPhotos;
  const placeholderCount = showAddButton ? Math.max(0, maxPhotos - visiblePhotos.length) : 0;

  return (
    <View style={styles.grid} testID={testID}>
      {visiblePhotos.map((uri, index) => (
        <View key={index} style={styles.cell}>
          <Image source={{ uri }} style={styles.photo} />
          {index === maxPhotos - 1 && remainingCount > 0 && (
            <View style={styles.overlay}>
              <Text style={styles.overlayText}>+{remainingCount}</Text>
            </View>
          )}
        </View>
      ))}
      {Array.from({ length: placeholderCount }).map((_, index) => (
        <Pressable
          key={`placeholder-${index}`}
          style={styles.addButton}
          onPress={onAddPhoto}
          accessibilityRole="button"
          accessibilityLabel={t('common.addPhoto', 'Add Photo')}
          testID={testID ? `${testID}-add-${index}` : undefined}
        >
          <View style={styles.addIconWrap}>
            <Plus size={20} color={colors.primary} />
          </View>
          <Text style={styles.addLabel}>{t('customer.postTask.photosAdd', 'Add Photo')}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cell: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16, 38, 56, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayText: {
    fontSize: typography.heading,
    fontWeight: '700',
    color: colors.primaryForeground,
  },
  addButton: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.chipInactive,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.muted,
    gap: spacing.sm,
    padding: spacing.md,
  },
  addIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '12',
  },
  addLabel: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
  },
});
