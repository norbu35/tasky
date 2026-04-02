import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LogIn } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { mobileTheme } from '../../design/tokenAdapter';
import { ModalSheet } from '../../components/ui/ModalSheet';
import { useAuthStore } from '../../store/authStore';

const { colors, spacing, typography, radius } = mobileTheme;

export default function SessionExpiredScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  const handleLogin = useCallback(() => {
    setSession(null);
    router.replace('/(auth)');
  }, [router, setSession]);

  return (
    <View style={styles.container} testID="session-expired-screen">
      <View style={styles.scrim} />
      <ModalSheet
        visible
        title={t('infra.sessionExpired.title', 'Хугацаа дууссан')}
        onClose={() => {}}
        dismissible={false}
        primaryAction={{
          label: t('infra.sessionExpired.loginButton', 'Дахин нэвтрэх'),
          onPress: handleLogin,
          testID: 'session-expired-screen-login',
        }}
      >
        <View style={styles.content}>
          <View style={styles.iconShell}>
            <LogIn size={28} color={colors.primary} />
          </View>
          <Text style={styles.body}>
            {t(
              'infra.sessionExpired.body',
              'Таны нэвтрэх хугацаа дууссан байна. Дахин нэвтэрнэ үү',
            )}
          </Text>
        </View>
      </ModalSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    zIndex: 30,
    backgroundColor: colors.background,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16, 38, 56, 0.35)',
  },
  content: {
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  iconShell: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.muted,
    marginBottom: spacing.lg,
  },
  body: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
