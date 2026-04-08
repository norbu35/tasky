import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { defaultStackScreenOptions, modalStackScreenOptions } from '../../design/navigationOptions';

export default function SharedLayout() {
  const { t } = useTranslation();
  return (
    <Stack screenOptions={defaultStackScreenOptions}>
      {/* Profile */}
      <Stack.Screen
        name="profile/edit"
        options={{
          ...modalStackScreenOptions,
          title: t('shared.profile.editTitle'),
        }}
      />
      <Stack.Screen
        name="profile/settings"
        options={{ title: t('shared.profile.settings') }}
      />
      <Stack.Screen
        name="profile/delete"
        options={{
          ...modalStackScreenOptions,
          title: t('shared.profile.deleteTitle'),
        }}
      />
      {/* Notifications */}
      <Stack.Screen
        name="notifications"
        options={{ title: t('shared.notifications.title') }}
      />
      {/* Reviews */}
      <Stack.Screen
        name="review/[bookingId]"
        options={{
          ...modalStackScreenOptions,
          title: t('shared.review.title'),
        }}
      />
      {/* Legal */}
      <Stack.Screen
        name="legal/terms"
        options={{ title: t('shared.legal.termsTitle') }}
      />
      <Stack.Screen
        name="legal/privacy"
        options={{ title: t('shared.legal.privacyTitle') }}
      />
      {/* Help */}
      <Stack.Screen
        name="help"
        options={{ title: t('shared.help.title') }}
      />
      {/* Infrastructure — full-screen, no header */}
      <Stack.Screen name="network-error" options={{ headerShown: false }} />
      <Stack.Screen name="app-update" options={{ headerShown: false }} />
      <Stack.Screen name="session-expired" options={{ headerShown: false }} />
      <Stack.Screen name="account/suspended" options={{ headerShown: false }} />
      <Stack.Screen name="account/banned" options={{ headerShown: false }} />
    </Stack>
  );
}
