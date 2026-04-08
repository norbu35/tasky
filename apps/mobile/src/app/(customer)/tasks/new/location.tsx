import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LocateFixed, Minus, Navigation, Plus } from 'lucide-react-native';
import { FormWizardTemplate } from '../../../../components/templates/FormWizardTemplate';
import { FormField } from '../../../../components/ui/FormField';
import { Input } from '../../../../components/ui/Input';
import { elevations } from '../../../../design/elevations';
import { mobileTheme } from '../../../../design/tokenAdapter';

const { colors } = mobileTheme;

// Ulaanbaatar city centre
const UB_CENTER = { latitude: 47.9184, longitude: 106.9177 };

function parseCoordinateParam(value?: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function LocationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{
    categoryId: string;
    description: string;
    intakeAnswers?: string;
    intakeSchemaVersion?: string;
    photos: string;
    location?: string;
    lat?: string;
    lng?: string;
  }>();
  const initialLat = parseCoordinateParam(params.lat);
  const initialLng = parseCoordinateParam(params.lng);
  const [locationText, setLocationText] = useState(params.location ?? '');
  const [pin, setPin] = useState<{ latitude: number; longitude: number } | null>(
    initialLat !== null && initialLng !== null
      ? { latitude: initialLat, longitude: initialLng }
      : null,
  );

  const quickLocations = [
    t('customer.postTask.quickLocationHome', 'Home'),
    t('customer.postTask.quickLocationWork', 'Work'),
    t('customer.postTask.quickLocationSukhbaatar', 'Sukhbaatar Square'),
  ];

  const handleNext = () => {
    if (!pin) {
      return;
    }

    router.push({
      pathname: '/(customer)/tasks/new/schedule',
      params: {
        categoryId: params.categoryId,
        description: params.description,
        intakeAnswers: params.intakeAnswers,
        intakeSchemaVersion: params.intakeSchemaVersion,
        photos: params.photos,
        location: locationText,
        lat: String(pin.latitude),
        lng: String(pin.longitude),
      },
    });
  };

  return (
    <FormWizardTemplate
      testID="SCR-CUST-005"
      currentStep={3}
      totalSteps={7}
      onNext={handleNext}
      onBack={() => router.back()}
      nextLabel={t('common.continue', 'Continue')}
      nextDisabled={!pin}
    >
      <View className="gap-sm">
        <Text className="text-heading font-extrabold text-primaryDeep">
          {t('customer.postTask.locationPageTitle', 'Set Location')}
        </Text>
        <Text className="text-body text-textSecondary leading-relaxed">
          {t('customer.postTask.locationInstruction', 'Pin the task location on the map')}
        </Text>
      </View>

      {/* mapShell: overflow hidden, shadow → imperative */}
      <View
        className="rounded-lg overflow-hidden bg-muted"
        style={{ minHeight: 280, ...elevations.soft }}
      >
        {/* map: MapView always imperative */}
        <MapView
          style={{ alignSelf: 'stretch', height: 280 }}
          initialRegion={{
            ...UB_CENTER,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          onPress={(e) => {
            setPin(e.nativeEvent.coordinate);
          }}
          testID="location-map"
        >
          <UrlTile
            urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
            flipY={false}
          />
          {pin ? <Marker coordinate={pin} /> : null}
        </MapView>

        {/* mapOverlay: absolute position → imperative */}
        <View
          pointerEvents="none"
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
          className="items-center justify-center gap-xs"
        >
          <View className="px-lg py-sm rounded-md bg-primaryDeep">
            <Text className="text-label font-bold text-primaryForeground">
              {t('customer.postTask.pickHere', 'Pick here')}
            </Text>
          </View>
          <View className="w-8 h-8 rounded-full items-center justify-center bg-primary">
            <Navigation size={16} color={colors.primaryForeground} />
          </View>
        </View>

        {/* mapControls: absolute position → imperative */}
        <View
          style={{ position: 'absolute', right: 12, bottom: 12 }}
          className="gap-sm"
        >
          <Pressable
            className="w-[42px] h-[42px] rounded-sm items-center justify-center bg-card border border-border"
            accessibilityRole="button"
            testID="location-locate-button"
          >
            <LocateFixed size={18} color={colors.primaryDeep} />
          </Pressable>
          <Pressable
            className="w-[42px] h-[42px] rounded-sm items-center justify-center bg-card border border-border"
            accessibilityRole="button"
            testID="location-zoom-in-button"
          >
            <Plus size={18} color={colors.primaryDeep} />
          </Pressable>
          <Pressable
            className="w-[42px] h-[42px] rounded-sm items-center justify-center bg-card border border-border"
            accessibilityRole="button"
            testID="location-zoom-out-button"
          >
            <Minus size={18} color={colors.primaryDeep} />
          </Pressable>
        </View>
      </View>

      <View className="mt-sm rounded-lg p-lg bg-muted gap-lg" testID="location-current-card">
        <View className="gap-xs">
          <Text className="text-subtitle font-extrabold text-primaryDeep">
            {pin
              ? t('customer.postTask.locationPinnedArea', 'Ulaanbaatar, Bayangol district')
              : t('customer.postTask.locationAwaitingPin', 'Drop a pin to unlock the next step')}
          </Text>
          <Text className="text-caption text-textSecondary">
            {pin
              ? t('customer.postTask.pinSet', 'Pin placed - tap to move it')
              : t('customer.postTask.tapToPin', 'Tap the map to pin the location')}
          </Text>
        </View>

        <FormField
          label={t('customer.postTask.locationDescriptionLabel', 'Location description')}
          helperText={t(
            'customer.postTask.locationHelper',
            'Provide details helpful for the Tasker',
          )}
        >
          <Input
            testID="location-text-input"
            value={locationText}
            onChangeText={setLocationText}
            placeholder={t(
              'customer.postTask.locationPlaceholder',
              'e.g., Behind State Dept Store, 5th floor',
            )}
            maxLength={500}
          />
        </FormField>

        <View className="gap-sm">
          <Text className="text-body font-bold text-primaryDeep">
            {t('customer.postTask.quickLocationsLabel', 'Popular locations')}
          </Text>
          <View className="flex-row flex-wrap gap-sm">
            {quickLocations.map((location) => (
              <Pressable
                key={location}
                onPress={() => setLocationText(location)}
                className="px-md py-sm rounded-full"
                style={{ backgroundColor: `${colors.primary}12` }}
                testID={`location-quick-${location}`}
                accessibilityRole="button"
              >
                <Text className="text-caption font-bold text-primaryDeep">{location}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="pt-xs">
          <Text className="text-caption text-textSecondary leading-relaxed">
            {t(
              'customer.postTask.locationPrivacy',
              'Taskers see approximate location. Exact address shown after booking confirmation',
            )}
          </Text>
        </View>
      </View>
    </FormWizardTemplate>
  );
}
