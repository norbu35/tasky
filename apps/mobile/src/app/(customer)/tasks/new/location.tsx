import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LocateFixed, Minus, Navigation, Plus } from 'lucide-react-native';
import { FormWizardTemplate } from '../../../../components/templates/FormWizardTemplate';
import { FormField } from '../../../../components/ui/FormField';
import { Input } from '../../../../components/ui/Input';
import { elevations } from '../../../../design/elevations';
import { mobileTheme } from '../../../../design/tokenAdapter';
import { getCurrentLocation } from '../../../../utils/permissions';
import { HttpMobileApiClient } from '../../../../lib/mobileApiClient';
import { useAuthStore } from '../../../../store/authStore';

const api = new HttpMobileApiClient();

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

    (api as unknown as { requestJson: <T>(path: string, init: RequestInit, accessToken?: string, query?: Record<string, string | number | undefined>) => Promise<T> })
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
    mapRef.current?.getCamera().then((camera) => {
      if (!camera) return;
      mapRef.current?.animateCamera(
        { center: camera.center, zoom: (camera.zoom ?? 12) + 1 },
        { duration: 300 },
      );
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    mapRef.current?.getCamera().then((camera) => {
      if (!camera) return;
      mapRef.current?.animateCamera(
        { center: camera.center, zoom: (camera.zoom ?? 12) - 1 },
        { duration: 300 },
      );
    });
  }, []);

  const quickLocations = [
    t('LocationScreen.quickLocationHome'),
    t('LocationScreen.quickLocationWork'),
    t('LocationScreen.quickLocationSukhbaatar'),
  ];

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
        <Text className="text-heading font-extrabold text-primaryDeep">
          {t('LocationScreen.locationPageTitle')}
        </Text>
        <Text className="text-body text-textSecondary leading-relaxed">
          {t('LocationScreen.locationInstruction')}
        </Text>
      </View>

      {/* mapShell: overflow hidden, shadow → imperative */}
      <View
        className="rounded-lg overflow-hidden bg-muted"
        style={{ minHeight: 280, ...elevations.soft }}
      >
        {/* map: MapView always imperative */}
        <MapView
          ref={mapRef}
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
              {t('LocationScreen.pickHere')}
            </Text>
          </View>
          <View className="w-8 h-8 rounded-full items-center justify-center bg-primary">
            <Navigation size={16} color={colors.primaryForeground} />
          </View>
        </View>

        {/* mapControls: absolute position → imperative */}
        <View style={{ position: 'absolute', right: 12, bottom: 12 }} className="gap-sm">
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
          <Text className="text-subtitle font-extrabold text-primaryDeep">
            {reverseGeocoding
              ? t('LocationScreen.resolvingAddress')
              : pin
                ? t('LocationScreen.locationPinnedArea')
                : t('LocationScreen.locationAwaitingPin')}
          </Text>
          <Text className="text-caption text-textSecondary">
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
          <Text className="text-body font-bold text-primaryDeep">
            {t('LocationScreen.quickLocationsLabel')}
          </Text>
          <View className="flex-row flex-wrap gap-sm">
            {quickLocations.map((location) => (
              <Pressable
                key={location}
                onPress={() => {
                userEditedText.current = true;
                setLocationText(location);
              }}
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
            {t('LocationScreen.locationPrivacy')}
          </Text>
        </View>
      </View>
    </FormWizardTemplate>
  );
}
