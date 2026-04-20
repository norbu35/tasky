import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, UrlTile } from 'react-native-maps';

import { FormWizardTemplate } from '@/components/templates/FormWizardTemplate';
import { elevations } from '@/design/elevations';

import { UB_CENTER, DEFAULT_DELTA } from './TaskLocation.model';
import { MapControls } from './TaskLocation.MapControls';
import { MapOverlay } from './TaskLocation.MapOverlay';
import { LocationStatusCard } from './TaskLocation.LocationCard';
import { useTaskLocation } from './useTaskLocation';

export default function TaskLocationScreen() {
  const { t } = useTranslation();
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
  } = useTaskLocation();

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
        <Text className="text-heading font-extrabold text-primary-deep">
          {t('LocationScreen.locationPageTitle')}
        </Text>
        <Text className="text-body text-text-secondary leading-relaxed">
          {t('LocationScreen.locationInstruction')}
        </Text>
      </View>

      <View className="rounded-lg overflow-hidden bg-muted min-h-[280px]" style={elevations.soft}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_DEFAULT}
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
          <UrlTile
            urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
            flipY={false}
          />
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
