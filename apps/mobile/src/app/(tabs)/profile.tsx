import { SafeAreaView } from 'react-native-safe-area-context';
import { ProfileView } from '../../features/profile/components/ProfileView';
import { useAuthStore } from '../../store/authStore';
import { LoginRequiredCTA } from '../../components/ui/LoginRequiredCTA';

export default function ProfileScreen() {
    const session = useAuthStore((state) => state.session);

    if (!session) {
        return (
            <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: 'white' }}>
                <LoginRequiredCTA message="You need to be logged in to view and edit your profile." />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: 'white' }}>
            <ProfileView />
        </SafeAreaView>
    );
}
