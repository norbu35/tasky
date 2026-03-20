import { SafeAreaView } from 'react-native-safe-area-context';
import { ProfileView } from '../../features/profile/components/ProfileView';
import { useAuthStore } from '../../store/authStore';
import { LoginRequiredCTA } from '../../components/ui/LoginRequiredCTA';
import { useTranslation } from 'react-i18next';

export default function ProfileScreen() {
    const session = useAuthStore((state) => state.session);
    const { t } = useTranslation();

    if (!session) {
        return (
            <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: 'white' }}>
                <LoginRequiredCTA message={t('auth.loginToViewProfile')} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: 'white' }}>
            <ProfileView />
        </SafeAreaView>
    );
}
