import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { defaultStackScreenOptions } from '../../design/navigationOptions';

export default function AuthLayout() {
  const { t } = useTranslation();
  return (
    <Stack screenOptions={defaultStackScreenOptions}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="role-select" options={{ headerShown: true, title: t('auth.roleSelection.header', ' ') }} />
      <Stack.Screen name="otp" options={{ headerShown: true, title: t('auth.otp.heading', 'Код баталгаажуулах') }} />
      <Stack.Screen name="otp-migration" options={{ headerShown: true, title: ' ' }} />
      <Stack.Screen name="permission-camera" options={{ headerShown: true, title: ' ' }} />
      <Stack.Screen name="permission-location" options={{ headerShown: true, title: ' ' }} />
      <Stack.Screen name="permission-notifications" options={{ headerShown: true, title: ' ' }} />
    </Stack>
  );
}
