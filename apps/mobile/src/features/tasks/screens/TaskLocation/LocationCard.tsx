import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Touchable } from '@/components/ui/Touchable';
import { mobileTheme } from '@/design/tokenAdapter';

const { colors } = mobileTheme;

interface LocationStatusCardProps {
  pin: { latitude: number; longitude: number } | null;
  reverseGeocoding: boolean;
  locationText: string;
  onLocationTextChange: (text: string) => void;
  recentLocations:
    | { location_lat: number; location_lng: number; location_text: string }[]
    | undefined;
  loadingRecent: boolean;
  onSelectRecent: (lat: number, lng: number, text: string) => void;
}

export function LocationStatusCard({
  pin,
  reverseGeocoding,
  locationText,
  onLocationTextChange,
  recentLocations,
  loadingRecent,
  onSelectRecent,
}: LocationStatusCardProps) {
  const { t } = useTranslation();

  return (
    <View className="mt-sm rounded-lg p-lg bg-muted gap-lg" testID="location-current-card">
      <View className="gap-xs">
        <Text className="text-subtitle font-extrabold text-primary-deep">
          {reverseGeocoding
            ? t('LocationScreen.resolvingAddress')
            : pin
              ? t('LocationScreen.locationPinnedArea')
              : t('LocationScreen.locationAwaitingPin')}
        </Text>
        <Text className="text-caption text-text-secondary">
          {pin ? t('LocationScreen.pinSet') : t('LocationScreen.tapToPin')}
        </Text>
      </View>

      <FormField
        label={t('LocationScreen.locationDescriptionLabel')}
        helperText={t('LocationScreen.locationHelper')}
      >
        <Input
          testID="location-text-input"
          value={locationText}
          onChangeText={onLocationTextChange}
          placeholder={t('LocationScreen.locationPlaceholder')}
          maxLength={500}
        />
      </FormField>

      <View className="gap-sm">
        <Text className="text-body font-bold text-primary-deep">
          {t('LocationScreen.recentLocationsLabel')}
        </Text>
        {loadingRecent ? (
          <View className="flex-row gap-sm">
            {[1, 2, 3].map((i) => (
              <View key={i} className="h-8 rounded-full bg-muted w-[100px] opacity-50" />
            ))}
          </View>
        ) : recentLocations && recentLocations.length > 0 ? (
          <View className="flex-row flex-wrap gap-sm">
            {recentLocations.map((loc, idx) => (
              <Touchable
                key={idx}
                onPress={() =>
                  onSelectRecent(loc.location_lat, loc.location_lng, loc.location_text)
                }
                className="px-md py-sm rounded-full"
                style={{ backgroundColor: `${colors.primary}12`, maxWidth: '90%' }}
                testID={`location-recent-${idx}`}
                accessibilityRole="button"
              >
                <Text
                  className="text-caption font-bold text-primary-deep"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {loc.location_text}
                </Text>
              </Touchable>
            ))}
          </View>
        ) : (
          <Text className="text-caption text-text-secondary">
            {t('LocationScreen.noRecentLocations')}
          </Text>
        )}
      </View>

      <View className="pt-xs">
        <Text className="text-caption text-text-secondary leading-relaxed">
          {t('LocationScreen.locationPrivacy')}
        </Text>
      </View>
    </View>
  );
}
