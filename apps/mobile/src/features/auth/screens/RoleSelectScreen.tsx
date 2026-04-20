import { useRouter } from 'expo-router';
import { ArrowRight, Briefcase, Check, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { AuthTemplate } from '@/components/templates/AuthTemplate';
import { Button, ModalSheet } from '@/components/ui';
import { Touchable } from '@/components/ui/Touchable';
import { elevations } from '@/design/elevations';
import { mobileTheme } from '@/design/tokenAdapter';
import { cn } from '@/lib/cn';
import { useAppStore } from '@/store/appStore';

const { colors } = mobileTheme;
const ROLE_SELECT_SURFACE = {
  roleIconBox: 56,
  roleIconRadius: 18,
  checkSize: 20,
  headingLineHeight: 32,
  bodyLineHeight: 24,
  descriptionLineHeight: 20,
  confirmHeight: 56,
  confirmRadius: 12,
} as const;

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
      <Touchable
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
            className="items-center justify-center"
            style={{
              width: ROLE_SELECT_SURFACE.roleIconBox,
              height: ROLE_SELECT_SURFACE.roleIconBox,
              borderRadius: ROLE_SELECT_SURFACE.roleIconRadius,
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
              style={{
                color: colors.textSecondary,
                lineHeight: ROLE_SELECT_SURFACE.descriptionLineHeight,
              }}
            >
              {t(descriptionKey, roleCopy[role])}
            </Text>
          </View>
          {isSelected ? (
            <View
              testID={`role-card-${role}-check`}
              className="rounded-full items-center justify-center"
              style={{
                width: ROLE_SELECT_SURFACE.checkSize,
                height: ROLE_SELECT_SURFACE.checkSize,
                backgroundColor: colors.primaryDeep,
              }}
            >
              <Check size={16} color={colors.primaryForeground} />
            </View>
          ) : null}
        </View>
      </Touchable>
    );
  };

  return (
    <AuthTemplate testID="SCR-SHARED-006" contentStyle={{ justifyContent: 'center' }}>
      <View className="mb-xl">
        <Text
          className="text-heading font-sans-bold text-center"
          style={{ color: colors.primaryDeep, lineHeight: ROLE_SELECT_SURFACE.headingLineHeight }}
        >
          {t('auth.roleSelection.heading')}
        </Text>
        <Text
          className="text-body text-center"
          style={{ color: colors.textSecondary, lineHeight: ROLE_SELECT_SURFACE.bodyLineHeight }}
        >
          {t('RoleSelectScreen.copy5')}
        </Text>
      </View>

      <View className="gap-md">{(['customer', 'tasker'] as const).map(renderRoleCard)}</View>

      <Button
        testID="role-confirm-button"
        onPress={handleConfirm}
        disabled={!selectedRole}
        style={{
          minHeight: ROLE_SELECT_SURFACE.confirmHeight,
          borderRadius: ROLE_SELECT_SURFACE.confirmRadius,
        }}
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
        <Text
          className="text-body"
          style={{ color: colors.textSecondary, lineHeight: ROLE_SELECT_SURFACE.bodyLineHeight }}
        >
          {t('auth.roleSelection.confirmSheetMessage', {
            role: roleLabel,
            defaultValue: `${roleLabel} болохоо баталгаажуулна уу. Тохиргооноос дараа солих боломжтой.`,
          })}
        </Text>
      </ModalSheet>
    </AuthTemplate>
  );
}
