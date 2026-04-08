import { Stack } from 'expo-router';
import { useAuthStore } from '../../../store/authStore';
import { LoginRequiredCTA } from '../../../components/ui/LoginRequiredCTA';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

export default function InboxLayout() {
  const session = useAuthStore((state) => state.session);
  const { t } = useTranslation();

  if (!session) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-background">
        <LoginRequiredCTA message={t('auth.loginReason')} />
      </SafeAreaView>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
