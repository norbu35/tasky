import { Stack } from 'expo-router';
import { useAuthStore } from '../../../store/authStore';
import { LoginRequiredCTA } from '../../../components/ui/LoginRequiredCTA';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function InboxLayout() {
    const session = useAuthStore((state) => state.session);

    if (!session) {
        return (
            <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: 'white' }}>
                <LoginRequiredCTA message="You need to be logged in to view and send messages." />
            </SafeAreaView>
        );
    }

    return <Stack screenOptions={{ headerShown: false }} />;
}
