import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LocateFixed, Minus, Navigation, Plus } from 'lucide-react-native';
import { FormWizardTemplate } from '../../../../components/templates/FormWizardTemplate';
import { FormField } from '../../../../components/ui/FormField';
import { Input } from '../../../../components/ui/Input';
import { mobileTheme } from '../../../../design/tokenAdapter';

const { colors, spacing, typography, radius } = mobileTheme;

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
  const quickLocations = [
    t('customer.postTask.quickLocationHome', 'Home'),
    t('customer.postTask.quickLocationWork', 'Work'),
    t('customer.postTask.quickLocationSukhbaatar', 'Sukhbaatar Square'),
  ];
  const [pin, setPin] = useState<{ latitude: number; longitude: number } | null>(
    initialLat !== null && initialLng !== null
      ? { latitude: initialLat, longitude: initialLng }
      : null,
  );
  const stepLabel = t('taskPost.step', 'Step {{current}} of {{total}}')
    .replace('{{current}}', '4')
    .replace('{{total}}', '7');

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
      nextDisabled={!pin}
      testID="location-screen"
    >
      <Text style={styles.stepLabel}>{stepLabel}</Text>
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
        <View pointerEvents="none" style={styles.mapCenterOverlay}>
          <View style={styles.pickHereBadge}>
            <Text style={styles.pickHereText}>{t('customer.postTask.pickHere', 'Pick here')}</Text>
          </View>
          <View style={styles.pinIconWrap}>
            <Navigation size={16} color={colors.primaryForeground} />
          </View>
        </View>
        <View style={styles.mapControls}>
          <Pressable style={styles.mapControlButton} accessibilityRole="button" testID="location-locate-button">
            <LocateFixed size={18} color={colors.primaryDeep} />
          </Pressable>
          <Pressable style={styles.mapControlButton} accessibilityRole="button" testID="location-zoom-in-button">
            <Plus size={18} color={colors.primaryDeep} />
          </Pressable>
          <Pressable style={styles.mapControlButton} accessibilityRole="button" testID="location-zoom-out-button">
            <Minus size={18} color={colors.primaryDeep} />
          </Pressable>
        </View>
        <Text style={styles.mapHint}>
          {pin
            ? t('customer.postTask.pinSet', 'Pin placed - tap to move it')
            : t('customer.postTask.tapToPin', 'Tap the map to pin the location')}
        </Text>
      </View>

      <View style={styles.statusCard} testID="location-current-card">
        <Text style={styles.statusLabel}>
          {t('customer.postTask.currentLocationLabel', 'Current location')}
        </Text>
        <Text style={styles.statusValue}>
          {pin
            ? t('customer.postTask.locationPinnedArea', 'Ulaanbaatar, Bayangol district')
            : t('customer.postTask.locationAwaitingPin', 'Drop a pin to unlock the next step')}
        </Text>
      </View>

      <FormField
        label={t('customer.postTask.locationDescriptionLabel', 'Location description')}
        helperText={t('customer.postTask.locationHelper', 'Provide details helpful for the Tasker')}
      >
        <Input
          testID="location-text-input"
          value={locationText}
          onChangeText={setLocationText}
          placeholder={t(
            'customer.postTask.locationPlaceholder',
            'e.g., Behind State Dept Store, 5th floor',
          )}
          maxLength={100}
        />
      </FormField>
      <View style={styles.quickLocationsSection}>
        <Text style={styles.quickLocationsLabel}>
          {t('customer.postTask.quickLocationsLabel', 'Popular locations')}
        </Text>
        <View style={styles.quickLocationsRow}>
          {quickLocations.map((location) => (
            <Pressable
              key={location}
              onPress={() => setLocationText(location)}
              style={styles.quickChip}
              testID={`location-quick-${location}`}
              accessibilityRole="button"
            >
              <Text style={styles.quickChipText}>{location}</Text>
            </Pressable>
          ))}
        </View>
      </View>
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
  stepLabel: {
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.textSecondary,
  },
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
    height: 260,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  mapCenterOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  pickHereBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primaryDeep,
  },
  pickHereText: {
    fontSize: typography.label,
    color: colors.primaryForeground,
    fontWeight: '700',
  },
  pinIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  mapControls: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.xl,
    gap: spacing.sm,
  },
  mapControlButton: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapHint: {
    fontSize: typography.caption,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  statusCard: {
    borderRadius: radius.md,
    padding: spacing.lg,
    backgroundColor: colors.muted,
    gap: spacing.xs,
  },
  statusLabel: {
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.textSecondary,
  },
  statusValue: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  privacyNote: {
    fontSize: typography.caption,
    color: colors.mutedForeground,
    marginTop: spacing.md,
    lineHeight: typography.caption * 1.6,
  },
  quickLocationsSection: {
    gap: spacing.sm,
  },
  quickLocationsLabel: {
    fontSize: typography.caption,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    fontWeight: '700',
  },
  quickLocationsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickChip: {
    backgroundColor: `${colors.mutedForeground}20`,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  quickChipText: {
    fontSize: typography.caption,
    color: colors.foreground,
    fontWeight: '600',
  },
});
