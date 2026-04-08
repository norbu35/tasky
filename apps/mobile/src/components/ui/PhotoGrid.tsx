import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { mobileTheme } from '../../design/tokenAdapter';
import { cn } from '../../lib/cn';

const { colors } = mobileTheme;

interface PhotoGridProps {
  photos: string[];
  maxPhotos?: number;
  onAddPhoto?: () => void;
  showAddButton?: boolean;
  testID?: string;
  className?: string;
}

export function PhotoGrid({
  photos,
  maxPhotos = 4,
  onAddPhoto,
  showAddButton = false,
  testID,
  className,
}: PhotoGridProps) {
  const { t } = useTranslation();
  const visiblePhotos = photos.slice(0, maxPhotos);
  const remainingCount = photos.length - maxPhotos;
  const placeholderCount = showAddButton ? Math.max(0, maxPhotos - visiblePhotos.length) : 0;

  return (
    <View className={cn('flex-row flex-wrap gap-sm', className)} testID={testID}>
      {visiblePhotos.map((uri, index) => (
        <View key={index} className="w-[48%] aspect-square rounded-md overflow-hidden">
          <Image source={{ uri }} className="w-full h-full" />
          {index === maxPhotos - 1 && remainingCount > 0 && (
            <View style={StyleSheet.absoluteFillObject} className="bg-[rgba(16,38,56,0.5)] items-center justify-center">
              <Text className="text-heading font-sans-bold text-primary-foreground">
                +{remainingCount}
              </Text>
            </View>
          )}
        </View>
      ))}
      {Array.from({ length: placeholderCount }).map((_, index) => (
        <Pressable
          key={`placeholder-${index}`}
          style={{ borderColor: colors.chipInactive, backgroundColor: colors.primary + '12' }}
          className="w-[48%] aspect-square rounded-md border-2 border-dashed bg-muted items-center justify-center gap-sm p-md"
          onPress={onAddPhoto}
          accessibilityRole="button"
          accessibilityLabel={t('Photos.addPhoto')}
          testID={testID ? `${testID}-add-${index}` : undefined}
        >
          <View className="w-[36px] h-[36px] rounded-full items-center justify-center" style={{ backgroundColor: colors.primary + '12' }}>
            <Plus size={20} color={colors.primary} />
          </View>
          <Text className="text-caption font-sans-bold text-primary text-center">
            {t('Photos.addPhoto')}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
