import { useRouter } from 'expo-router';
import { ArrowRight, Briefcase, Check, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { AuthTemplate } from '../../components/templates/AuthTemplate';
import { Button, ModalSheet } from '../../components/ui';
import { elevations } from '../../design/elevations';
import { mobileTheme } from '../../design/tokenAdapter';
import { cn } from '../../lib/cn';
import { useAppStore } from '../../store/appStore';

const { colors } = mobileTheme;

type RoleOption = 'customer' | 'tasker' | null;

export default function RoleSelectScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const setRole = useAppStore((state) => state.setRole);
  const [selectedRole, setSelectedRole] = useState<RoleOption>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const roleLabels: Record<Exclude<RoleOption, null>, string> = {
    customer: t('RoleSelectScreen.copy1'),
    tasker: t('RoleSelectScreen.copy2'),
  };
  const roleCopy = {
    customer: t('RoleSelectScreen.copy3'),
    tasker: t('RoleSelectScreen.copy4'),
  } as const;

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

  const roleLabel = selectedRole ? roleLabels[selectedRole] : roleLabels.customer;

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
        className={cn('rounded-xl overflow-hidden', isSelected && 'border-2')}
        style={
          isSelected
            ? {
                // colors.card is '#FFFFFF'; test asserts '#ffffff' so normalize case
                backgroundColor: (colors.card as string).toLowerCase(),
                borderColor: colors.primaryDeep,
                ...elevations.soft,
              }
            : { backgroundColor: colors.muted }
        }
      >
        <View className="flex-row items-center gap-md p-lg">
          <View
            className="w-[56px] h-[56px] rounded-[18px] items-center justify-center"
            style={{
              backgroundColor: isSelected ? colors.secondary : colors.chipInactive,
            }}
          >
            <Icon size={28} color={isSelected ? colors.primaryDeep : colors.foreground} />
          </View>
          <View className="flex-1">
            <Text className="text-title font-sans-semibold" style={{ color: colors.primaryDeep }}>
              {t(titleKey, roleLabels[role])}
            </Text>
            <Text
              className="text-label mt-xs"
              style={{ color: colors.textSecondary, lineHeight: 20 }}
            >
              {t(descriptionKey, roleCopy[role])}
            </Text>
          </View>
          {isSelected ? (
            <View
              testID={`role-card-${role}-check`}
              className="w-[20px] h-[20px] rounded-full items-center justify-center"
              style={{ backgroundColor: colors.primaryDeep }}
            >
              <Check size={14} color={colors.primaryForeground} />
            </View>
          ) : null}
        </View>
      </Pressable>
    );
  };

  return (
    <AuthTemplate testID="SCR-SHARED-006" contentStyle={{ justifyContent: 'center' }}>
      <View className="mb-xl">
        <Text
          className="text-heading font-sans-bold text-center"
          style={{ color: colors.primaryDeep, lineHeight: undefined }}
        >
          {t('auth.roleSelection.heading')}
        </Text>
        <Text
          className="text-body text-center"
          style={{ color: colors.textSecondary, lineHeight: 24 }}
        >
          {t('RoleSelectScreen.copy5')}
        </Text>
      </View>

      <View className="gap-md">{(['customer', 'tasker'] as const).map(renderRoleCard)}</View>

      <Button
        testID="role-confirm-button"
        onPress={handleConfirm}
        disabled={!selectedRole}
        style={{ minHeight: 56, borderRadius: 12 }}
      >
        <View className="flex-row items-center justify-center gap-sm">
          <Text className="text-label font-sans-bold text-primary-foreground">
            {t('auth.roleSelection.confirm')}
          </Text>
          <ArrowRight size={16} color={colors.primaryForeground} />
        </View>
      </Button>

      <ModalSheet
        visible={isConfirming}
        title={t('auth.roleSelection.confirmSheetTitle')}
        onClose={() => setIsConfirming(false)}
        dismissible={false}
        primaryAction={{
          label: t('auth.roleSelection.confirmSheetPrimary'),
          onPress: handleConfirmSelection,
          testID: 'role-sheet-confirm',
        }}
        secondaryAction={{
          label: t('auth.roleSelection.confirmSheetSecondary'),
          onPress: () => setIsConfirming(false),
          testID: 'role-sheet-cancel',
        }}
      >
        <Text className="text-body" style={{ color: colors.textSecondary, lineHeight: 24 }}>
          {t('auth.roleSelection.confirmSheetMessage', {
            role: roleLabel,
            defaultValue: `${roleLabel} болохоо баталгаажуулна уу. Тохиргооноос дараа солих боломжтой.`,
          })}
        </Text>
      </ModalSheet>
    </AuthTemplate>
  );
}
