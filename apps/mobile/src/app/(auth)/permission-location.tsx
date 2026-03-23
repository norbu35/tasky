import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react-native';
import { AuthTemplate } from '../../components/templates/AuthTemplate';
import { PermissionPrimer } from '../../components/ui';
import { requestLocationPermission } from '../../utils/permissions';
import { mobileTheme } from '../../design/tokenAdapter';

const { colors } = mobileTheme;

export default function PermissionLocationScreen() {
    const { t } = useTranslation();
    const router = useRouter();

    const handleGrant = async () => {
        await requestLocationPermission();
        router.replace('/(auth)/permission-notifications');
    };

    const handleSkip = () => {
        router.replace('/(auth)/permission-notifications');
    };

    return (
        <AuthTemplate testID="permission-location-screen">
            <PermissionPrimer
                icon={<MapPin size={48} color={colors.primary} />}
                title={t('auth.permissions.locationTitle', 'Location Access')}
                description={t(
                    'auth.permissions.locationDescription',
                    'Find tasks and Taskers near you'
                )}
                onGrant={handleGrant}
                onSkip={handleSkip}
                testID="permission-location-primer"
            />
        </AuthTemplate>
    );
}
