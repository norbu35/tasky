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
          title: t('shared.profile.editTitle', 'Edit Profile'),
        }}
      />
      <Stack.Screen
        name="profile/settings"
        options={{ title: t('shared.profile.settings', 'Settings') }}
      />
      <Stack.Screen
        name="profile/delete"
        options={{
          ...modalStackScreenOptions,
          title: t('shared.profile.deleteTitle', 'Delete Account'),
        }}
      />
      {/* Notifications */}
      <Stack.Screen
        name="notifications"
        options={{ title: t('shared.notifications.title', 'Notifications') }}
      />
      {/* Reviews */}
      <Stack.Screen
        name="review/[bookingId]"
        options={{
          ...modalStackScreenOptions,
          title: t('shared.review.title', 'Leave a Review'),
        }}
      />
      {/* Legal */}
      <Stack.Screen
        name="legal/terms"
        options={{ title: t('shared.legal.termsTitle', 'Terms of Service') }}
      />
      <Stack.Screen
        name="legal/privacy"
        options={{ title: t('shared.legal.privacyTitle', 'Нууцлалын бодлого') }}
      />
      {/* Help */}
      <Stack.Screen
        name="help"
        options={{ title: t('shared.help.title', 'Help & Support') }}
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
