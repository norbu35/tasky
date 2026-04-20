import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useTaskDraftStore } from '@/features/tasks/draft';
import { useRecentLocations } from '@/features/tasks/hooks/useRecentLocations';
import { reverseGeocode } from '@/features/tasks/api';
import { useAuthStore } from '@/store/authStore';
import { getCurrentLocation } from '@/utils/permissions';
import MapView, { Region } from 'react-native-maps';

import {
  UB_CENTER,
  DEFAULT_DELTA,
  ZOOM_DELTA,
  ANIMATE_DURATION,
  makeRegion,
} from './TaskLocation.model';

export function useTaskLocation() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const { draftId } = useLocalSearchParams<{ draftId: string }>();
  const draft = useTaskDraftStore((s) => s.drafts[draftId]);
  const updateDraft = useTaskDraftStore((s) => s.updateDraft);

  const initialLat = draft?.location?.lat ?? null;
  const initialLng = draft?.location?.lng ?? null;
  const [locationText, setLocationText] = useState(draft?.location?.text ?? '');
  const [pin, setPin] = useState<{ latitude: number; longitude: number } | null>(
    initialLat !== null && initialLng !== null
      ? { latitude: initialLat, longitude: initialLng }
      : null,
  );
  const [locating, setLocating] = useState(false);
  const [reverseGeocoding, setReverseGeocoding] = useState(false);
  const currentRegion = useRef<Region>({
    ...UB_CENTER,
    latitudeDelta: DEFAULT_DELTA,
    longitudeDelta: DEFAULT_DELTA,
  });

  const { data: recentLocations, isLoading: loadingRecent } = useRecentLocations();

  const mapRef = useRef<MapView>(null);
  const userEditedText = useRef(false);

  const handleLocationTextChange = useCallback((text: string) => {
    userEditedText.current = true;
    setLocationText(text);
  }, []);

  useEffect(() => {
    if (initialLat !== null && initialLng !== null) return;
    let cancelled = false;
    getCurrentLocation().then((loc) => {
      if (cancelled || !loc) return;
      const coord = { latitude: loc.latitude, longitude: loc.longitude };
      setPin(coord);
      mapRef.current?.animateToRegion(
        makeRegion(loc.latitude, loc.longitude, ZOOM_DELTA),
        ANIMATE_DURATION,
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!pin) return;
    if (userEditedText.current) return;

    let cancelled = false;
    setReverseGeocoding(true);

    const accessToken = session?.accessToken ?? undefined;

    reverseGeocode(accessToken, pin.latitude, pin.longitude)
      .then((data) => {
        if (cancelled) return;
        if (!userEditedText.current) {
          setLocationText(data.formatted_address);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setReverseGeocoding(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pin?.latitude, pin?.longitude, session]);

  const handleLocate = useCallback(async () => {
    setLocating(true);
    try {
      const loc = await getCurrentLocation();
      if (!loc) return;
      const coord = { latitude: loc.latitude, longitude: loc.longitude };
      setPin(coord);
      mapRef.current?.animateToRegion(
        makeRegion(loc.latitude, loc.longitude, ZOOM_DELTA),
        ANIMATE_DURATION,
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

  const handleSelectRecent = useCallback((lat: number, lng: number, text: string) => {
    const coord = { latitude: lat, longitude: lng };
    setPin(coord);
    userEditedText.current = true;
    setLocationText(text);
    mapRef.current?.animateToRegion(makeRegion(lat, lng, ZOOM_DELTA), ANIMATE_DURATION);
  }, []);

  const handleMapPress = useCallback((coordinate: { latitude: number; longitude: number }) => {
    setPin(coordinate);
  }, []);

  const handleRegionChange = useCallback((region: Region) => {
    currentRegion.current = region;
  }, []);

  const handleNext = () => {
    if (!pin) return;
    updateDraft(draftId, {
      location: { lat: pin.latitude, lng: pin.longitude, text: locationText },
      currentStep: 3,
    });
    router.push({
      pathname: '/(customer)/tasks/new/schedule',
      params: { draftId },
    });
  };

  return {
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
    goBack: () => router.back(),
  };
}
