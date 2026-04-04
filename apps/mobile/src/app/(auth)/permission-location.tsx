import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import { PermissionPrimer } from '../../components/ui';
import { requestLocationPermission } from '../../utils/permissions';
import { mobileTheme } from '../../design/tokenAdapter';

const { colors } = mobileTheme;

export default function PermissionLocationScreen() {
  const router = useRouter();
  const [isDenied, setIsDenied] = React.useState(false);

  const goNext = () => {
    router.replace('/(auth)/permission-notifications');
  };

  const handleGrant = async () => {
    const result = await requestLocationPermission();
    if (result.status === 'granted') {
      goNext();
      return;
    }
    setIsDenied(true);
  };

  return (
    <View testID="SCR-SHARED-008" style={styles.container}>
      <PermissionPrimer
        icon={<MapPin size={48} color={colors.primaryDeep} />}
        title="Байршил ашиглах зөвшөөрөл"
        description="Ойролцоох даалгавруудыг харуулах, байршил тодорхойлоход хэрэгтэй"
        deniedMessage="Байршлын зөвшөөрөл хаагдсан"
        settingsHint="Тохиргооноос байршлыг нээх боломжтой"
        continueLabel="Үргэлжлүүлэх"
        allowLabel="Зөвшөөрөх"
        skipLabel="Дараа хийх"
        isDenied={isDenied}
        onGrant={() => {
          void handleGrant();
        }}
        onSkip={goNext}
        onContinue={goNext}
        testID="permission-location-primer"
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
