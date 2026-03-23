import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Briefcase, User } from 'lucide-react-native';
import { AuthTemplate } from '../../components/templates/AuthTemplate';
import { Button, PressableCard } from '../../components/ui';
import { useAppStore } from '../../store/appStore';
import { mobileTheme } from '../../design/tokenAdapter';

const { colors, spacing, typography, radius } = mobileTheme;

type RoleOption = 'customer' | 'tasker' | null;

export default function RoleSelectScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const setRole = useAppStore((state) => state.setRole);
  const [selectedRole, setSelectedRole] = useState<RoleOption>(null);

  const handleConfirm = () => {
    if (!selectedRole) return;
    setRole(selectedRole);
    router.replace('/(auth)/permission-camera');
  };

  return (
    <AuthTemplate
      headline={t('auth.roleSelection.title', 'How will you use Tasky?')}
      testID="role-select-screen"
    >
      <PressableCard
        testID="role-card-customer"
        onPress={() => setSelectedRole('customer')}
        style={[styles.roleCard, selectedRole === 'customer' && styles.roleCardSelected]}
      >
        <View style={styles.roleCardContent}>
          <User
            size={32}
            color={selectedRole === 'customer' ? colors.primaryForeground : colors.primary}
          />
          <Text style={[styles.roleTitle, selectedRole === 'customer' && styles.roleTitleSelected]}>
            {t('auth.roleSelection.customerTitle', 'I need help')}
          </Text>
          <Text
            style={[
              styles.roleDescription,
              selectedRole === 'customer' && styles.roleDescriptionSelected,
            ]}
          >
            {t('auth.roleSelection.customerDescription', 'Find verified Taskers for your jobs')}
          </Text>
        </View>
      </PressableCard>

      <PressableCard
        testID="role-card-tasker"
        onPress={() => setSelectedRole('tasker')}
        style={[styles.roleCard, selectedRole === 'tasker' && styles.roleCardSelected]}
      >
        <View style={styles.roleCardContent}>
          <Briefcase
            size={32}
            color={selectedRole === 'tasker' ? colors.primaryForeground : colors.primary}
          />
          <Text style={[styles.roleTitle, selectedRole === 'tasker' && styles.roleTitleSelected]}>
            {t('auth.roleSelection.taskerTitle', 'I want to work')}
          </Text>
          <Text
            style={[
              styles.roleDescription,
              selectedRole === 'tasker' && styles.roleDescriptionSelected,
            ]}
          >
            {t('auth.roleSelection.taskerDescription', 'Get matched with jobs near you')}
          </Text>
        </View>
      </PressableCard>

      <Button
        testID="role-confirm-button"
        label={t('auth.roleSelection.confirm', 'Continue')}
        onPress={handleConfirm}
        disabled={!selectedRole}
        style={styles.confirmButton}
      />
    </AuthTemplate>
  );
}

const styles = StyleSheet.create({
  roleCard: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    padding: spacing.lg,
  },
  roleCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  roleCardContent: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  roleTitle: {
    fontSize: typography.title,
    fontWeight: '600',
    color: colors.foreground,
    textAlign: 'center',
  },
  roleTitleSelected: {
    color: colors.primaryForeground,
  },
  roleDescription: {
    fontSize: typography.body,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  roleDescriptionSelected: {
    color: colors.primaryForeground,
  },
  confirmButton: {
    marginTop: spacing.md,
  },
});
