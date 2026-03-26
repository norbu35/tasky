import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, Lock, MessageSquareMore, TimerReset } from 'lucide-react-native';
import { Button } from '../../components/ui';
import { requestNotificationPermission } from '../../utils/permissions';
import { useAppStore } from '../../store/appStore';
import { mobileTheme } from '../../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

const BENEFITS = [
  {
    key: 'instant',
    title: 'Шуурхай мэдээлэл',
    body: 'Захиалга болон хүсэлтийн талаарх мэдээллийг шууд гар утсандаа авна.',
    Icon: MessageSquareMore,
  },
  {
    key: 'security',
    title: 'Аюулгүй байдал',
    body: 'Таны бүртгэл болон төлбөр тооцооны аюулгүй байдлын чухал мэдэгдлүүд.',
    Icon: Lock,
  },
  {
    key: 'reminders',
    title: 'Сануулах үйлчилгээ',
    body: 'Төлөвлөсөн ажлын цаг дөхөхөд бид танд урьдчилан сануулах болно.',
    Icon: TimerReset,
  },
];

export default function PermissionNotificationsScreen() {
  const router = useRouter();
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const [isDenied, setIsDenied] = React.useState(false);

  const finishFlow = () => {
    completeOnboarding();
    router.replace('/(tabs)');
  };

  const handleGrant = async () => {
    const result = await requestNotificationPermission();
    if (result.status === 'granted') {
      finishFlow();
      return;
    }
    setIsDenied(true);
  };

  return (
    <View style={styles.container} testID="permission-notifications-screen">
      <View style={styles.header} testID="permission-notifications-header">
        <Text style={styles.brand}>Tasky</Text>
        <View style={styles.headerButton} />
      </View>

      <View style={styles.hero} testID="permission-notifications-hero">
        <View style={styles.heroGlow} />
        <View style={styles.heroCard}>
          <Bell size={56} color={colors.primary} />
        </View>
        <View style={styles.heroAccent}>
          <Lock size={18} color={colors.primaryDeep} />
        </View>
      </View>

      <View style={styles.copyBlock}>
        <Text style={styles.title}>Мэдэгдэл хүлээн авах</Text>
        <Text style={styles.description}>
          Ажлын явцыг цаг алдалгүй хянаж, үйлчилгээний чанарыг сайжруулахад тусална.
        </Text>
      </View>

      <View style={styles.benefits} testID="permission-notifications-benefits">
        {BENEFITS.map(({ key, title, body, Icon }, index) => (
          <View key={key} style={styles.benefitCard} testID={`permission-notifications-benefit-${index}`}>
            <View style={styles.benefitIcon}>
              <Icon size={18} color={colors.primary} />
            </View>
            <View style={styles.benefitCopy}>
              <Text style={styles.benefitTitle}>{title}</Text>
              <Text style={styles.benefitBody}>{body}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.footer} testID="permission-notifications-footer">
        {isDenied ? (
          <>
            <Text style={styles.deniedMessage}>Мэдэгдлийн зөвшөөрөл хаагдсан</Text>
            <Text style={styles.settingsHint}>Тохиргооноос мэдэгдлийг нээх боломжтой</Text>
            <Button
              testID="permission-continue-button"
              label="Үргэлжлүүлэх"
              onPress={finishFlow}
              style={styles.primaryButton}
              accessibilityLabel="Үргэлжлүүлэх"
            />
          </>
        ) : (
          <>
            <Button
              testID="permission-allow-button"
              label="Мэдэгдэл зөвшөөрөх"
              onPress={() => {
                void handleGrant();
              }}
              style={styles.primaryButton}
              accessibilityLabel="Мэдэгдэл зөвшөөрөх"
            />
            <Button
              testID="permission-skip-button"
              label="Дараа"
              variant="ghost"
              onPress={finishFlow}
              accessibilityLabel="Дараа"
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  brand: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primaryDeep,
    letterSpacing: -1.2,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#e9e8e5',
  },
  hero: {
    marginTop: 12,
    marginHorizontal: 24,
    minHeight: 208,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroGlow: {
    ...StyleSheet.absoluteFillObject,
    margin: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(171,201,242,0.2)',
  },
  heroCard: {
    width: 192,
    height: 192,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroAccent: {
    position: 'absolute',
    top: 12,
    right: 54,
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#fdce6a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyBlock: {
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: colors.primaryDeep,
    letterSpacing: -0.75,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 260,
  },
  benefits: {
    paddingHorizontal: 24,
    gap: 16,
  },
  benefitCard: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: '#f4f3f0',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitCopy: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    color: colors.primaryDeep,
    marginBottom: 4,
  },
  benefitBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  footer: {
    marginTop: 'auto',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.78)',
    gap: 12,
  },
  deniedMessage: {
    fontSize: typography.body,
    color: colors.primaryDeep,
    textAlign: 'center',
  },
  settingsHint: {
    fontSize: typography.label,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 8,
  },
});
