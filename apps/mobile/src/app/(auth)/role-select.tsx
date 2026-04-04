import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Briefcase, Check, User } from 'lucide-react-native';
import { AuthTemplate } from '../../components/templates/AuthTemplate';
import { Button, ModalSheet } from '../../components/ui';
import { useAppStore } from '../../store/appStore';
import { mobileTheme } from '../../design/tokenAdapter';
import { elevations } from '../../design/elevations';

const { colors, spacing, typography } = mobileTheme;

type RoleOption = 'customer' | 'tasker' | null;

const ROLE_LABELS: Record<Exclude<RoleOption, null>, string> = {
  customer: 'Захиалагч',
  tasker: 'Гүйцэтгэгч',
};

const ROLE_COPY = {
  customer: 'Даалгавар оруулж, гүйцэтгэгч олох',
  tasker: 'Даалгавар хүлээж аваад орлого олох',
} as const;

export default function RoleSelectScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const setRole = useAppStore((state) => state.setRole);
  const [selectedRole, setSelectedRole] = useState<RoleOption>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = () => {
    if (!selectedRole) return;
    setIsConfirming(true);
  };

  const handleConfirmSelection = () => {
    if (!selectedRole) return;
    setRole(selectedRole);
    setIsConfirming(false);
    router.replace('/(auth)/permission-camera');
  };

  const roleLabel = selectedRole ? ROLE_LABELS[selectedRole] : ROLE_LABELS.customer;

  const renderRoleCard = (role: Exclude<RoleOption, null>) => {
    const isSelected = selectedRole === role;
    const Icon = role === 'customer' ? User : Briefcase;
    const titleKey =
      role === 'customer' ? 'auth.roleSelection.customerTitle' : 'auth.roleSelection.taskerTitle';
    const descriptionKey =
      role === 'customer'
        ? 'auth.roleSelection.customerDescription'
        : 'auth.roleSelection.taskerDescription';

    return (
      <Pressable
        key={role}
        testID={`role-card-${role}`}
        onPress={() => setSelectedRole(role)}
        style={[styles.roleCard, isSelected && styles.roleCardSelected]}
      >
        <View style={styles.roleCardContent}>
          <View
            style={[
              styles.roleIcon,
              isSelected ? styles.roleIconSelected : styles.roleIconUnselected,
            ]}
          >
            <Icon size={28} color={isSelected ? colors.primaryDeep : colors.foreground} />
          </View>
          <View style={styles.roleCopy}>
            <Text style={styles.roleTitle}>{t(titleKey, ROLE_LABELS[role])}</Text>
            <Text style={styles.roleDescription}>{t(descriptionKey, ROLE_COPY[role])}</Text>
          </View>
          {isSelected ? (
            <View testID={`role-card-${role}-check`} style={styles.checkMark}>
              <Check size={14} color={colors.primaryForeground} />
            </View>
          ) : null}
        </View>
      </Pressable>
    );
  };

  return (
    <AuthTemplate testID="role-select-screen" contentStyle={styles.contentStyle}>
      <View style={styles.hero}>
        <Text style={styles.heading}>{t('auth.roleSelection.heading', 'Та хэн бэ?')}</Text>
        <Text style={styles.subtitle}>
          {t(
            'auth.roleSelection.subtitle',
            'Өөрийн дүрийг сонгоно уу. Та дараа нь өөрчлөх боломжтой.',
          )}
        </Text>
      </View>

      <View style={styles.cards}>{(['customer', 'tasker'] as const).map(renderRoleCard)}</View>

      <Button
        testID="role-confirm-button"
        onPress={handleConfirm}
        disabled={!selectedRole}
        style={styles.confirmButton}
      >
        <View style={styles.confirmContent}>
          <Text style={styles.confirmLabel}>{t('auth.roleSelection.confirm', 'Үргэлжлүүлэх')}</Text>
          <ArrowRight size={16} color={colors.primaryForeground} />
        </View>
      </Button>

      <ModalSheet
        visible={isConfirming}
        title={t('auth.roleSelection.confirmSheetTitle', 'Та итгэлтэй байна уу?')}
        onClose={() => setIsConfirming(false)}
        dismissible={false}
        primaryAction={{
          label: t('auth.roleSelection.confirmSheetPrimary', 'Тийм, баталгаажуулах'),
          onPress: handleConfirmSelection,
          testID: 'role-sheet-confirm',
        }}
        secondaryAction={{
          label: t('auth.roleSelection.confirmSheetSecondary', 'Буцах'),
          onPress: () => setIsConfirming(false),
          testID: 'role-sheet-cancel',
        }}
      >
        <Text style={styles.sheetMessage}>
          {t(
            'auth.roleSelection.confirmSheetMessage',
            `${roleLabel} болохоо баталгаажуулна уу. Тохиргооноос дараа солих боломжтой.`,
          )}
        </Text>
      </ModalSheet>
    </AuthTemplate>
  );
}

const styles = StyleSheet.create({
  contentStyle: {
    justifyContent: 'center',
  },
  hero: {
    marginBottom: spacing.xl,
  },
  heading: {
    fontSize: typography.heading,
    fontWeight: '700',
    color: colors.primaryDeep,
    textAlign: 'center',
    lineHeight: typography.heading * 1.25,
  },
  subtitle: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  cards: {
    gap: spacing.md,
  },
  roleCard: {
    borderRadius: 12,
    backgroundColor: colors.muted,
    overflow: 'hidden',
  },
  roleCardSelected: {
    borderWidth: 2,
    borderColor: colors.primaryDeep,
    backgroundColor: colors.background,
    ...elevations.soft,
  },
  roleCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  roleIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconSelected: {
    backgroundColor: colors.secondary,
  },
  roleIconUnselected: {
    backgroundColor: colors.chipInactive,
  },
  roleCopy: {
    flex: 1,
  },
  checkMark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryDeep,
  },
  roleTitle: {
    fontSize: typography.title,
    fontWeight: '600',
    color: colors.primaryDeep,
  },
  roleDescription: {
    fontSize: typography.label,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  confirmButton: {
    minHeight: 56,
    borderRadius: 12,
  },
  confirmContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  confirmLabel: {
    color: colors.primaryForeground,
    fontSize: typography.label,
    fontWeight: '700',
  },
  sheetMessage: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
});
