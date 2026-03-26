import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
      <View style={styles.headerBlock} testID="permission-camera-header-block">
        <Text style={styles.headerTitle}>Хувийн мэдээлэл</Text>
        <Text style={styles.headerSubtitle}>Таны бүртгэл болон баталгаажуулалт</Text>
        <View style={styles.summaryCard} testID="permission-camera-summary-card">
          <Text style={styles.summaryTitle}>Дансны баталгаажуулалт</Text>
          <Text style={styles.summarySubtitle}>Камер ашиглан нүүр тулгах</Text>
        </View>
      </View>
      <PermissionPrimer
        icon={<Camera size={48} color={colors.primary} />}
        title="Камер ашиглах зөвшөөрөл"
        description="Зураг оруулах, баталгаажуулахад камер хэрэгтэй"
        deniedMessage="Камерын зөвшөөрөл хаагдсан"
        settingsHint="Тохиргооноос камерыг нээх боломжтой"
        continueLabel="Үргэлжлүүлэх"
        allowLabel="Зөвшөөрөх"
        skipLabel="Дараа"
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
  headerBlock: {
    paddingHorizontal: 24,
    paddingTop: 96,
    paddingBottom: 32,
    gap: 8,
  },
  headerTitle: {
    color: colors.primaryDeep,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.75,
  },
  headerSubtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 26,
  },
  summaryCard: {
    marginTop: 16,
    backgroundColor: '#f4f3f0',
    borderRadius: 12,
    padding: 24,
  },
  summaryTitle: {
    color: colors.primaryDeep,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  summarySubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});
