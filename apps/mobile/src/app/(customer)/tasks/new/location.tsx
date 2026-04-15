import { useRouter, useLocalSearchParams } from 'expo-router';
import { LocateFixed, Minus, Navigation, Plus } from 'lucide-react-native';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, Region, UrlTile } from 'react-native-maps';

import { FormWizardTemplate } from '../../../../components/templates/FormWizardTemplate';
import { FormField } from '../../../../components/ui/FormField';
import { Input } from '../../../../components/ui/Input';
import { elevations } from '../../../../design/elevations';
import { mobileTheme } from '../../../../design/tokenAdapter';
import { useRecentLocations } from '../../../../features/tasks/hooks/useRecentLocations';
import { createMobileApiClient } from '../../../../lib/mobileApiClient';
import { useAuthStore } from '../../../../store/authStore';
import { getCurrentLocation } from '../../../../utils/permissions';

const api = createMobileApiClient();

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
  const session = useAuthStore((s) => s.session);
  const params = useLocalSearchParams<{
    categoryId: string;
    categoryName?: string;
    description: string;
    intakeAnswers?: string;
    intakeSchemaVersion?: string;
    intakeSchemaJson?: string;
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
  const [locating, setLocating] = useState(false);
  const [reverseGeocoding, setReverseGeocoding] = useState(false);
  const currentRegion = useRef<Region>({
    ...UB_CENTER,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const { data: recentLocations, isLoading: loadingRecent } = useRecentLocations();

  const mapRef = useRef<MapView>(null);
  const userEditedText = useRef(false);

  const handleLocationTextChange = useCallback((text: string) => {
    userEditedText.current = true;
    setLocationText(text);
  }, []);

  // On mount: seed map from device location if no pin from nav params
  useEffect(() => {
    if (initialLat !== null && initialLng !== null) {
      return;
    }
    let cancelled = false;
    getCurrentLocation().then((loc) => {
      if (cancelled || !loc) return;
      const coord = { latitude: loc.latitude, longitude: loc.longitude };
      setPin(coord);
      mapRef.current?.animateToRegion(
        {
          latitude: loc.latitude,
          longitude: loc.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        600,
      );
    });
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reverse geocode on pin change
  useEffect(() => {
    if (!pin) return;
    if (userEditedText.current) return;

    let cancelled = false;
    setReverseGeocoding(true);

    const accessToken = session?.accessToken ?? undefined;

    (
      api as unknown as {
        requestJson: <T>(
          path: string,
          init: RequestInit,
          accessToken?: string,
          query?: Record<string, string | number | undefined>,
        ) => Promise<T>;
      }
    )
      .requestJson<{ formatted_address: string }>(
        '/location/reverse-geocode',
        { method: 'GET' },
        accessToken,
        { lat: pin.latitude, lng: pin.longitude },
      )
      .then((data) => {
        if (cancelled) return;
        if (!userEditedText.current) {
          setLocationText(data.formatted_address);
        }
      })
      .catch(() => {
        // silently ignore geocode failures
      })
      .finally(() => {
        if (!cancelled) setReverseGeocoding(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pin?.latitude, pin?.longitude, session]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLocate = useCallback(async () => {
    setLocating(true);
    try {
      const loc = await getCurrentLocation();
      if (!loc) return;
      const coord = { latitude: loc.latitude, longitude: loc.longitude };
      setPin(coord);
      mapRef.current?.animateToRegion(
        {
          latitude: loc.latitude,
          longitude: loc.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        600,
      );
    } finally {
      setLocating(false);
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    const r = currentRegion.current;
    mapRef.current?.animateToRegion(
      { ...r, latitudeDelta: r.latitudeDelta / 2, longitudeDelta: r.longitudeDelta / 2 },
      300,
    );
  }, []);

  const handleZoomOut = useCallback(() => {
    const r = currentRegion.current;
    mapRef.current?.animateToRegion(
      { ...r, latitudeDelta: r.latitudeDelta * 2, longitudeDelta: r.longitudeDelta * 2 },
      300,
    );
  }, []);

  const handleNext = () => {
    if (!pin) {
      return;
    }

    router.push({
      pathname: '/(customer)/tasks/new/schedule',
      params: {
        categoryId: params.categoryId,
        categoryName: params.categoryName ?? '',
        description: params.description,
        intakeAnswers: params.intakeAnswers,
        intakeSchemaVersion: params.intakeSchemaVersion,
        intakeSchemaJson: params.intakeSchemaJson,
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
      nextLabel={t('common.continue')}
      nextDisabled={!pin}
    >
      <View className="gap-sm">
        <Text className="text-heading font-extrabold text-primary-deep">
          {t('LocationScreen.locationPageTitle')}
        </Text>
        <Text className="text-body text-text-secondary leading-relaxed">
          {t('LocationScreen.locationInstruction')}
        </Text>
      </View>

      {/* mapShell: overflow hidden, shadow → imperative */}
      <View className="rounded-lg overflow-hidden bg-muted min-h-[280px]" style={elevations.soft}>
        {/* map: MapView always imperative */}
        <MapView
          ref={mapRef}
          provider={PROVIDER_DEFAULT}
          style={{ alignSelf: 'stretch', height: 280 }}
          initialRegion={{
            ...UB_CENTER,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          onPress={(e) => {
            setPin(e.nativeEvent.coordinate);
          }}
          onRegionChangeComplete={(region) => {
            currentRegion.current = region;
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
        <View pointerEvents="none" className="absolute inset-0 items-center justify-center gap-xs">
          <View className="px-lg py-sm rounded-md bg-primary-deep">
            <Text className="text-label font-bold text-primary-foreground">
              {t('LocationScreen.pickHere')}
            </Text>
          </View>
          <View className="w-8 h-8 rounded-full items-center justify-center bg-primary">
            <Navigation size={16} color={colors.primaryForeground} />
          </View>
        </View>

        {/* mapControls: absolute position → imperative */}
        <View className="absolute right-3 bottom-3 gap-sm">
          <Pressable
            className="w-[42px] h-[42px] rounded-sm items-center justify-center bg-card border border-border"
            accessibilityRole="button"
            testID="location-locate-button"
            onPress={handleLocate}
          >
            {locating ? (
              <ActivityIndicator size="small" color={colors.primaryDeep} />
            ) : (
              <LocateFixed size={18} color={colors.primaryDeep} />
            )}
          </Pressable>
          <Pressable
            className="w-[42px] h-[42px] rounded-sm items-center justify-center bg-card border border-border"
            accessibilityRole="button"
            testID="location-zoom-in-button"
            onPress={handleZoomIn}
          >
            <Plus size={18} color={colors.primaryDeep} />
          </Pressable>
          <Pressable
            className="w-[42px] h-[42px] rounded-sm items-center justify-center bg-card border border-border"
            accessibilityRole="button"
            testID="location-zoom-out-button"
            onPress={handleZoomOut}
          >
            <Minus size={18} color={colors.primaryDeep} />
          </Pressable>
        </View>
      </View>

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
            onChangeText={handleLocationTextChange}
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
                <Pressable
                  key={idx}
                  onPress={() => {
                    const coord = { latitude: loc.location_lat, longitude: loc.location_lng };
                    setPin(coord);
                    userEditedText.current = true;
                    setLocationText(loc.location_text);
                    mapRef.current?.animateToRegion(
                      {
                        ...coord,
                        latitudeDelta: 0.02,
                        longitudeDelta: 0.02,
                      },
                      600,
                    );
                  }}
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
                </Pressable>
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
    </FormWizardTemplate>
  );
}
