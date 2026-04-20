import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { defaultStackScreenOptions } from '@/design/navigationOptions';
import { mobileTheme } from '@/design/tokenAdapter';

export default function AuthLayout() {
  const { t } = useTranslation();
  return (
    <Stack screenOptions={defaultStackScreenOptions}>
      {/* cardStyle background prevents the splash LinearGradient from bleeding
          through during the root→auth navigation transition (DEF-001). */}
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          contentStyle: { backgroundColor: mobileTheme.colors.background },
        }}
      />
      <Stack.Screen
        name="role-select"
        options={{ headerShown: true, title: t('auth.roleSelection.header') }}
      />
      <Stack.Screen
        name="permission-camera"
        options={{ headerShown: true, title: t('AuthLayout.copy2') }}
      />
      <Stack.Screen
        name="permission-location"
        options={{ headerShown: true, title: t('AuthLayout.copy3') }}
      />
      <Stack.Screen
        name="permission-notifications"
        options={{ headerShown: true, title: t('AuthLayout.copy4') }}
      />
    </Stack>
  );
}
