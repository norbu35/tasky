import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Camera } from 'lucide-react-native';
import { PermissionPrimer } from '../../components/ui';
import { requestCameraPermission } from '../../utils/permissions';
import { mobileTheme } from '../../design/tokenAdapter';

const { colors } = mobileTheme;

export default function PermissionCameraScreen() {
  const router = useRouter();
  const [isDenied, setIsDenied] = React.useState(false);

  const goNext = () => {
    router.replace('/(auth)/permission-location');
  };

  const handleGrant = async () => {
    const result = await requestCameraPermission();
    if (result.status === 'granted') {
      goNext();
      return;
    }
    setIsDenied(true);
  };

  return (
    <View style={styles.container} testID="permission-camera-screen">
      <PermissionPrimer
        icon={<Camera size={48} color={colors.primaryDeep} />}
        title="Камер ашиглах зөвшөөрөл"
        description="Зураг оруулах, баталгаажуулалт хийхэд камер хэрэгтэй"
        deniedMessage="Камерын зөвшөөрөл хаагдсан"
        settingsHint="Тохиргооноос камерыг нээх боломжтой"
        continueLabel="Үргэлжлүүлэх"
        allowLabel="Зөвшөөрөх"
        skipLabel="Дараа хийх"
        isDenied={isDenied}
        onGrant={() => {
          void handleGrant();
        }}
        onSkip={goNext}
        onContinue={goNext}
        testID="permission-camera-primer"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
