import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Camera } from 'lucide-react-native';
import { AuthTemplate } from '../../components/templates/AuthTemplate';
import { PermissionPrimer } from '../../components/ui';
import { requestCameraPermission } from '../../utils/permissions';
import { mobileTheme } from '../../design/tokenAdapter';

const { colors } = mobileTheme;

export default function PermissionCameraScreen() {
    const { t } = useTranslation();
    const router = useRouter();

    const handleGrant = async () => {
        await requestCameraPermission();
        router.replace('/(auth)/permission-location');
    };

    const handleSkip = () => {
        router.replace('/(auth)/permission-location');
    };

    return (
        <AuthTemplate testID="permission-camera-screen">
            <PermissionPrimer
                icon={<Camera size={48} color={colors.primary} />}
                title={t('auth.permissions.cameraTitle', 'Camera Access')}
                description={t(
                    'auth.permissions.cameraDescription',
                    'Take photos for task posts and verification'
                )}
                onGrant={handleGrant}
                onSkip={handleSkip}
                testID="permission-camera-primer"
            />
        </AuthTemplate>
    );
}
