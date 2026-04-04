import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useAuthStore } from '../../../store/authStore';
import { LoginRequiredCTA } from '../../../components/ui/LoginRequiredCTA';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mobileTheme } from '../../../design/tokenAdapter';

export default function InboxLayout() {
  const session = useAuthStore((state) => state.session);

  if (!session) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <LoginRequiredCTA message="You need to be logged in to view and send messages." />
      </SafeAreaView>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: mobileTheme.colors.background,
  },
});
