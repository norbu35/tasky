import Constants from 'expo-constants';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE, UrlTile } from 'react-native-maps';

import { FormWizardTemplate } from '@/components/templates/FormWizardTemplate';
import { elevations } from '@/design/elevations';
import { PostingGuidanceCard } from '@/features/tasks/components/PostingGuidance';

import {
  DEFAULT_DELTA,
  getGoogleMapsRenderer,
  shouldUseGoogleMapsProvider,
  TaskLocationAppExtra,
  UB_CENTER,
} from './model';
import { MapControls } from './MapControls';
import { MapOverlay } from './MapOverlay';
import { LocationStatusCard } from './LocationCard';
import { useTaskLocationScreen } from './useTaskLocationScreen';

export default function TaskLocationScreen() {
  const { t } = useTranslation();
  const appExtra = Constants.expoConfig?.extra as TaskLocationAppExtra | undefined;
  const useGoogleMapsProvider = shouldUseGoogleMapsProvider(Platform.OS, appExtra);
  const googleRenderer = getGoogleMapsRenderer(Platform.OS, useGoogleMapsProvider);
  const {
    pin,
    locating,
    reverseGeocoding,
    locationText,
    recentLocations,
    loadingRecent,
    mapRef,
    handleLocationTextChange,
    handleLocate,
    handleZoomIn,
    handleZoomOut,
    handleSelectRecent,
    handleMapPress,
    handleRegionChange,
    handleNext,
    goBack,
  } = useTaskLocationScreen();

  return (
    <FormWizardTemplate
      testID="SCR-CUST-005"
      currentStep={3}
      totalSteps={7}
      onNext={handleNext}
      onBack={goBack}
      nextLabel={t('common.continue')}
      nextDisabled={!pin}
    >
      <View className="gap-sm">
        <Text className="text-heading font-display-bold text-primary-deep">
          {t('LocationScreen.locationPageTitle')}
        </Text>
        <Text className="text-body text-text-secondary leading-relaxed">
          {t('LocationScreen.locationInstruction')}
        </Text>
      </View>

      <PostingGuidanceCard
        titleKey="PostingGuidance.addressPrivacyTitle"
        bodyKey="PostingGuidance.addressPrivacyBody"
        testID="posting-guidance-address-privacy"
      />

      <View className="rounded-lg overflow-hidden bg-muted min-h-[280px]" style={elevations.soft}>
        <MapView
          ref={mapRef}
          provider={useGoogleMapsProvider ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
          googleRenderer={googleRenderer}
          style={{ alignSelf: 'stretch', height: 280 }}
          initialRegion={{
            ...UB_CENTER,
            latitudeDelta: DEFAULT_DELTA,
            longitudeDelta: DEFAULT_DELTA,
          }}
          onPress={(e) => handleMapPress(e.nativeEvent.coordinate)}
          onRegionChangeComplete={handleRegionChange}
          testID="location-map"
        >
          {!useGoogleMapsProvider ? (
            <UrlTile
              urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              maximumZ={19}
              flipY={false}
            />
          ) : null}
          {pin ? <Marker coordinate={pin} /> : null}
        </MapView>

        <MapOverlay />
        <MapControls
          locating={locating}
          onLocate={handleLocate}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
        />
      </View>

      <LocationStatusCard
        pin={pin}
        reverseGeocoding={reverseGeocoding}
        locationText={locationText}
        onLocationTextChange={handleLocationTextChange}
        recentLocations={recentLocations}
        loadingRecent={loadingRecent}
        onSelectRecent={handleSelectRecent}
      />
    </FormWizardTemplate>
  );
}
