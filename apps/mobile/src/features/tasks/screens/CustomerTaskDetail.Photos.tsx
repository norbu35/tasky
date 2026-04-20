import React from 'react';
import { Text, View } from 'react-native';

import { mobileSurfaces } from '@/design/surfaces';

const { taskDetail, tint } = mobileSurfaces;

interface PhotosSectionProps {
  photos: string[];
  t: (k: string) => string;
}

export function PhotosSection({ photos, t }: PhotosSectionProps) {
  return (
    <View className="bg-muted rounded-sm p-lg gap-sm">
      <View className="flex-row justify-between items-center">
        <Text className="text-subtitle font-extrabold text-foreground">
          {t('TaskDetailCustomerScreen.photos')}
        </Text>
        <Text
          className="text-caption font-extrabold text-center text-primary-deep"
          style={{
            minWidth: taskDetail.pillMinWidth,
            paddingHorizontal: taskDetail.pillInsetX,
            paddingVertical: taskDetail.pillInsetY,
            borderRadius: 9999,
            backgroundColor: tint.primarySoft,
          }}
        >
          {photos.length}
        </Text>
      </View>
      <View className="flex-row flex-wrap gap-sm">
        {photos.length > 0 ? (
          photos.slice(0, 4).map((photoKey, index) => (
            <View
              key={`${photoKey}-${index}`}
              className="rounded-md items-center justify-center"
              style={{
                width: taskDetail.photoTileWidth,
                height: taskDetail.photoTileHeight,
                backgroundColor: tint.primarySoft,
              }}
            >
              <Text className="text-body font-extrabold text-primary-deep">{index + 1}</Text>
            </View>
          ))
        ) : (
          <Text className="text-body text-text-secondary leading-relaxed">
            {t('TaskDetailCustomerScreen.noPhotos')}
          </Text>
        )}
      </View>
    </View>
  );
}
