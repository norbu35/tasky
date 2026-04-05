import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LocateFixed, Minus, Navigation, Plus } from 'lucide-react-native';
import { FormWizardTemplate } from '../../../../components/templates/FormWizardTemplate';
import { FormField } from '../../../../components/ui/FormField';
import { Input } from '../../../../components/ui/Input';
import { elevations } from '../../../../design/elevations';
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
      <View style={styles.hero}>
        <Text style={styles.title}>{t('customer.postTask.locationPageTitle', 'Set Location')}</Text>
        <Text style={styles.instruction}>
          {t('customer.postTask.locationInstruction', 'Pin the task location on the map')}
        </Text>
      </View>

      <View style={styles.mapShell}>
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
          {pin ? <Marker coordinate={pin} /> : null}
        </MapView>
        <View pointerEvents="none" style={styles.mapOverlay}>
          <View style={styles.pickHereBadge}>
            <Text style={styles.pickHereText}>{t('customer.postTask.pickHere', 'Pick here')}</Text>
          </View>
          <View style={styles.pinIconWrap}>
            <Navigation size={16} color={colors.primaryForeground} />
          </View>
        </View>
        <View style={styles.mapControls}>
          <Pressable
            style={styles.mapControlButton}
            accessibilityRole="button"
            testID="location-locate-button"
          >
            <LocateFixed size={18} color={colors.primaryDeep} />
          </Pressable>
          <Pressable
            style={styles.mapControlButton}
            accessibilityRole="button"
            testID="location-zoom-in-button"
          >
            <Plus size={18} color={colors.primaryDeep} />
          </Pressable>
          <Pressable
            style={styles.mapControlButton}
            accessibilityRole="button"
            testID="location-zoom-out-button"
          >
            <Minus size={18} color={colors.primaryDeep} />
          </Pressable>
        </View>
      </View>

      <View style={styles.sheetCard} testID="location-current-card">
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>
            {pin
              ? t('customer.postTask.locationPinnedArea', 'Ulaanbaatar, Bayangol district')
              : t('customer.postTask.locationAwaitingPin', 'Drop a pin to unlock the next step')}
          </Text>
          <Text style={styles.sheetStatus}>
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

        <View style={styles.privacyNoteRow}>
          <Text style={styles.privacyNote}>
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

const styles = StyleSheet.create({
  hero: {
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.heading,
    fontWeight: '800',
    color: colors.primaryDeep,
  },
  instruction: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: typography.body * 1.5,
  },
  mapShell: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.muted,
    minHeight: 280,
    ...elevations.soft,
  },
  map: {
    alignSelf: 'stretch',
    height: 280,
  },
  mapOverlay: {
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
    bottom: spacing.md,
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
  sheetCard: {
    marginTop: spacing.sm,
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.muted,
    gap: spacing.lg,
  },
  sheetHeader: {
    gap: spacing.xs,
  },
  sheetTitle: {
    fontSize: typography.subtitle,
    fontWeight: '800',
    color: colors.primaryDeep,
  },
  sheetStatus: {
    fontSize: typography.caption,
    color: colors.textSecondary,
  },
  quickLocationsSection: {
    gap: spacing.sm,
  },
  quickLocationsLabel: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  quickLocationsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: `${colors.primary}12`,
  },
  quickChipText: {
    fontSize: typography.caption,
    color: colors.primaryDeep,
    fontWeight: '700',
  },
  privacyNoteRow: {
    paddingTop: spacing.xs,
  },
  privacyNote: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    lineHeight: typography.caption * 1.5,
  },
});
