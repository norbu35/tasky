import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react-native';
import { AuthTemplate } from '../../components/templates/AuthTemplate';
import { PermissionPrimer } from '../../components/ui';
import { requestNotificationPermission } from '../../utils/permissions';
import { useAppStore } from '../../store/appStore';
import { mobileTheme } from '../../design/tokenAdapter';

const { colors } = mobileTheme;

export default function PermissionNotificationsScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const completeOnboarding = useAppStore((state) => state.completeOnboarding);

    const handleGrant = async () => {
        await requestNotificationPermission();
        completeOnboarding();
        router.replace('/(tabs)');
    };

    const handleSkip = () => {
        completeOnboarding();
        router.replace('/(tabs)');
    };

    return (
        <AuthTemplate testID="permission-notifications-screen">
            <PermissionPrimer
                icon={<Bell size={48} color={colors.primary} />}
                title={t('auth.permissions.notificationsTitle', 'Notifications')}
                description={t(
                    'auth.permissions.notificationsDescription',
                    'Get updates on bookings and messages'
                )}
                onGrant={handleGrant}
                onSkip={handleSkip}
                testID="permission-notifications-primer"
            />
        </AuthTemplate>
    );
}
