import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FormWizardTemplate } from '../../../../components/templates/FormWizardTemplate';
import { FormField } from '../../../../components/ui/FormField';
import { Input } from '../../../../components/ui/Input';
import { mobileTheme } from '../../../../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

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
  const [pinError, setPinError] = useState('');

  const handleNext = () => {
    if (!pin) {
      setPinError(t('customer.postTask.pinRequired', 'Pin the task location on the map'));
      return;
    }

    setPinError('');
    router.push({
      pathname: '/(customer)/tasks/new/schedule',
      params: {
        categoryId: params.categoryId,
        description: params.description,
        photos: params.photos,
        location: locationText,
        lat: String(pin.latitude),
        lng: String(pin.longitude),
      },
    });
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <FormWizardTemplate
      currentStep={3}
      totalSteps={7}
      onNext={handleNext}
      onBack={handleBack}
      nextLabel={t('common.continue', 'Continue')}
      testID="location-screen"
    >
      <Text style={styles.title}>{t('customer.postTask.locationPageTitle', 'Set Location')}</Text>
      <Text style={styles.instruction}>
        {t('customer.postTask.locationInstruction', 'Pin the task location on the map')}
      </Text>

      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            ...UB_CENTER,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          onPress={(e) => {
            setPin(e.nativeEvent.coordinate);
            if (pinError) {
              setPinError('');
            }
          }}
          testID="location-map"
        >
          <UrlTile
            urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
            flipY={false}
          />
          {pin && <Marker coordinate={pin} />}
        </MapView>
        <Text style={[styles.mapHint, pinError ? styles.mapHintError : null]}>
          {pinError ||
            (pin
              ? t('customer.postTask.pinSet', 'Pin placed - tap to move it')
              : t('customer.postTask.tapToPin', 'Tap the map to pin the location'))}
        </Text>
      </View>

      <FormField
        label={t('customer.postTask.locationLabel', 'Location details')}
        helperText={t('customer.postTask.locationHelper', 'Provide details helpful for the Tasker')}
      >
        <Input
          testID="location-text-input"
          value={locationText}
          onChangeText={setLocationText}
          placeholder={t('customer.postTask.locationPlaceholder', 'Enter location')}
          maxLength={100}
        />
      </FormField>
      <Text style={styles.privacyNote}>
        {t(
          'customer.postTask.locationPrivacy',
          'Taskers see approximate location. Exact address shown after booking confirmation',
        )}
      </Text>
    </FormWizardTemplate>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: typography.heading,
    fontWeight: '600',
    color: colors.primaryDeep,
  },
  instruction: {
    fontSize: typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    lineHeight: typography.body * 1.5,
  },
  mapContainer: {
    marginBottom: spacing.lg,
  },
  map: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mapHint: {
    fontSize: typography.caption,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  mapHintError: {
    color: colors.danger,
  },
  privacyNote: {
    fontSize: typography.caption,
    color: colors.mutedForeground,
    marginTop: spacing.md,
    lineHeight: typography.caption * 1.6,
  },
});
